import { supabase } from './supabaseClient';

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
  const { error } = await supabase
    .from('store_clients')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting client:', error);
    return false;
  }
  return true;
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
  
  // 2. Prepare ONLY winning QR Codes for bulk insert
  const winningQRs = qrCodesList.filter(qr => qr.isWinner);
  const qrPayloads = winningQRs.map(qr => ({
    id: qr.uuid, // Use the pre-generated UUID from the frontend
    client_id: clientId,
    print_run_id: runId,
    is_winner: qr.isWinner,
    is_claimed: false,
    coupon_code: qr.couponCode,
    sticker_number: qr.stickerNumber
  }));
  
  // 3. Insert Winning QR Codes (if any)
  if (qrPayloads.length > 0) {
    const { error: qrError } = await supabase
      .from('qr_codes')
      .insert(qrPayloads);
      
    if (qrError) {
      console.error('Error saving QR codes:', qrError);
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
    .select('*, store_clients(name)')
    .eq('id', qrId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching QR details:', error);
    return null;
  }
  
  return {
    id: data.id,
    clientId: data.client_id,
    storeName: data.store_clients?.name,
    isWinner: data.is_winner,
    isClaimed: data.is_claimed,
    couponCode: data.coupon_code,
    claimerName: data.claimer_name,
    claimerPhone: data.claimer_phone
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
    .select();
    
  if (error) {
    console.error('Error claiming QR code:', error);
    return false;
  }
  return true;
};
