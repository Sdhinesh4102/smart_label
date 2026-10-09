import { supabase } from './supabaseClient';
import { nextInvoiceNumber } from './invoiceNumbers';

// Clients (Stores) API
export const getClientsAsync = async () => {
  const { data, error } = await supabase
    .from('store_clients')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  
  // Map Supabase snake_case back to camelCase for the frontend
  return data.map(client => ({
    id: client.id,
    name: client.name,
    locationUrl: client.location_url,
    instagram: client.instagram,
    whatsapp: client.whatsapp,
    facebook: client.facebook,
    website: client.website,
    packageSize: client.package_size,
    stickersPrinted: client.stickers_printed,
    qrType: client.qr_type,
    rewardCount: client.reward_count,
    rewardCode: client.reward_code,
    logoData: client.logo_data,
    offerText: client.offer_text,
    createdAt: client.created_at
  }));
};

// Public scan pages need only one store and the fields shown to customers.
// Database RLS must also enforce this boundary; a narrow query alone does
// not protect the table from a direct API request.
export const getPublicClientAsync = async (clientId) => {
  const { data, error } = await supabase
    .from('store_clients')
    .select('id, name, location_url, instagram, whatsapp, facebook, website, qr_type, reward_code, logo_data, offer_text')
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    locationUrl: data.location_url,
    instagram: data.instagram,
    whatsapp: data.whatsapp,
    facebook: data.facebook,
    website: data.website,
    qrType: data.qr_type,
    rewardCode: data.reward_code,
    logoData: data.logo_data,
    offerText: data.offer_text
  };
};

export const saveClientAsync = async (client) => {
  const payload = {
    name: client.name,
    location_url: client.locationUrl,
    instagram: client.instagram,
    whatsapp: client.whatsapp,
    facebook: client.facebook,
    website: client.website,
    package_size: client.packageSize,
    stickers_printed: client.stickersPrinted,
    qr_type: client.qrType,
    reward_count: client.rewardCount,
    reward_code: client.rewardCode,
    logo_data: client.logoData,
    offer_text: client.offerText
  };

  let result;
  if (client.id && client.id.length > 10) { 
    // Has a UUID (update)
    result = await supabase
      .from('store_clients')
      .update(payload)
      .eq('id', client.id)
      .select();
  } else {
    // New insert
    result = await supabase
      .from('store_clients')
      .insert([payload])
      .select();
  }
  
  if (result.error) {
    console.error('Error saving client:', result.error);
    return null;
  }
  
  const saved = result.data[0];
  return {
    id: saved.id,
    name: saved.name,
    locationUrl: saved.location_url,
    instagram: saved.instagram,
    whatsapp: saved.whatsapp,
    facebook: saved.facebook,
    website: saved.website,
    packageSize: saved.package_size,
    stickersPrinted: saved.stickers_printed,
    qrType: saved.qr_type,
    rewardCount: saved.reward_count,
    rewardCode: saved.reward_code,
    logoData: saved.logo_data,
    offerText: saved.offer_text,
    createdAt: saved.created_at
  };
};

export const deleteClientAsync = async (id) => {
  // A printed/distributed QR must never lose its store page through the UI.
  const { count, error: runsError } = await supabase
    .from('print_runs')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id);
  if (runsError) {
    console.error('Could not check store QR batches:', runsError);
    return { success: false, reason: 'check_failed' };
  }
  if (count > 0) return { success: false, reason: 'has_qrs' };

  const { data: client, error: clientError } = await supabase
    .from('store_clients')
    .select('stickers_printed')
    .eq('id', id)
    .maybeSingle();
  if (clientError || !client) return { success: false, reason: 'check_failed' };
  if (Number(client.stickers_printed) > 0) return { success: false, reason: 'has_qrs' };

  const { error } = await supabase
    .from('store_clients')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting client:', error);
    return { success: false, reason: 'delete_failed' };
  }
  return { success: true };
};

// Print Runs and QR Codes API
export const savePrintRunAsync = async (clientId, quantity, winnersCount, qrCodesList) => {
  // 1. Create the Print Run
  const { data: runData, error: runError } = await supabase
    .from('print_runs')
    .insert([{
      client_id: clientId,
      quantity,
      winners_count: winnersCount
    }])
    .select();
    
  if (runError || !runData || runData.length === 0) {
    console.error('Error creating print run:', runError);
    return null;
  }
  
  const runId = runData[0].id;
  
  // Save every QR so losing stickers can also be recognized after one reveal.
  const qrPayloads = qrCodesList.map(qr => ({
    id: qr.uuid, // Use the pre-generated UUID from the frontend
    client_id: clientId,
    print_run_id: runId,
    is_winner: qr.isWinner,
    is_claimed: false,
    coupon_code: qr.couponCode,
    sticker_number: qr.stickerNumber
  }));
  
  // 3. Insert every QR in the batch.
  if (qrPayloads.length > 0) {
    const { error: qrError } = await supabase
      .from('qr_codes')
      .insert(qrPayloads);
      
    if (qrError) {
      console.error('Error saving QR codes:', qrError);
      // A failed batch must never be printed as though its QRs were active.
      const { error: rollbackError } = await supabase
        .from('print_runs')
        .delete()
        .eq('id', runId);
      if (rollbackError) console.error('Error rolling back print run:', rollbackError);
      return null;
    }
  }
  
  return runId;
};

export const logPrintRunAsync = async (clientId, quantity) => {
  const { data: clientData } = await supabase
    .from('store_clients')
    .select('stickers_printed')
    .eq('id', clientId)
    .single();
    
  if (clientData) {
    await supabase
      .from('store_clients')
      .update({ stickers_printed: (clientData.stickers_printed || 0) + quantity })
      .eq('id', clientId);
  }
};

// Customer Scan API
export const getQRCodeDetailsAsync = async (qrId) => {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('id, client_id, is_winner, is_claimed, coupon_code')
    .eq('id', qrId)
    .single();
    
  if (error?.code === 'PGRST116' || !data && !error) {
    return null;
  }
  if (error) {
    console.error('Error fetching QR details:', error);
    throw error;
  }
  
  return {
    id: data.id,
    clientId: data.client_id,
    isWinner: data.is_winner,
    isClaimed: data.is_claimed,
    couponCode: data.coupon_code
  };
};

export const claimQRCodeAsync = async (qrId, claimerName, claimerPhone) => {
  const { data, error } = await supabase
    .from('qr_codes')
    .update({
      is_claimed: true,
      claimer_name: claimerName,
      claimer_phone: claimerPhone,
      scanned_at: new Date().toISOString()
    })
    .eq('id', qrId)
    .eq('is_claimed', false)
    .select('id');
    
  if (error) {
    console.error('Error claiming QR code:', error);
    return false;
  }
  return data?.length === 1;
};

// --- Invoices API ---
export const getNextInvoiceNumberAsync = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number');
  if (error) throw error;
  return nextInvoiceNumber(data.map(invoice => invoice.invoice_number));
};

export const getInvoicesAsync = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
  return data;
};

export const saveInvoiceAsync = async (invoiceData) => {
  const payload = {
    invoice_number: invoiceData.invoice_number,
    client_id: invoiceData.client_id || null,
    client_name: invoiceData.client_name,
    date: invoiceData.date,
    due_date: invoiceData.due_date,
    total_amount: invoiceData.total_amount,
    status: invoiceData.status || 'Unpaid',
    items: invoiceData.items || []
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert([payload])
    .select();
    
  if (error) {
    console.error('Error saving invoice:', error);
    alert(`Failed to save invoice to database: ${error.message}`);
    return null;
  }
  return data[0];
};

export const updateInvoiceStatusAsync = async (id, status) => {
  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id);
    
  if (error) {
    console.error('Error updating invoice status:', error);
    return false;
  }
  return true;
};

export const deleteInvoiceAsync = async (id) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
  return true;
};
