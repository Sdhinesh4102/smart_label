import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdsokcdhecftrxebtrfs.supabase.co', 'sb_publishable_mXXLWL-6ngqPE1B09NAJRQ_sxobVlH0');

async function test() {
  const { data: runData, error: runError } = await supabase
    .from('print_runs')
    .insert([{
      client_id: '2a8d824e-fe14-4fde-a30e-d97f4940a6b5',
      quantity: 18,
      winners_count: 1
    }])
    .select();
  
  if (runError) {
    console.error('Run Error:', runError);
    return;
  }
  
  console.log('Run Data:', runData);
  
  const qrPayloads = [{
    id: crypto.randomUUID(),
    client_id: '2a8d824e-fe14-4fde-a30e-d97f4940a6b5',
    print_run_id: runData[0].id,
    is_winner: true,
    is_claimed: false,
    coupon_code: 'TESTCODE',
    sticker_number: 1
  }];
  
  const { error: qrError } = await supabase.from('qr_codes').insert(qrPayloads);
  console.log('QR Error:', qrError);
}
test();
