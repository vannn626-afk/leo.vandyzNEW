import React from 'react';
import {
  ShoppingBag, Zap, Crown, MessageCircle, ArrowUpRight, ShieldCheck,
  BadgeCheck, Sparkles, CreditCard, WalletCards, Check, ReceiptText,
  Percent, Clock3, Headphones
} from 'lucide-react';
import {createOrder,listRows} from '../services/platform';

const FALLBACK_PRODUCTS=[
  {id:'credits-500',product:'500 Credits',credits:500,price:10000,normal:20000,tag:'POPULAR',accent:'credits',desc:'Saldo credits untuk semua tool yang memakai sistem pemakaian.',benefits:['500 purchased credits','Tidak kedaluwarsa','Dipakai setelah free credits']},
  {id:'credits-1000',product:'1000 Credits',credits:1000,price:15000,normal:40000,tag:'BEST VALUE',accent:'credits',desc:'Paket credits besar untuk pemakaian tool yang lebih intens.',benefits:['1000 purchased credits','Tidak kedaluwarsa','Nilai per credit lebih hemat']},
  {id:'vip-1m',product:'VIP 1 Month',vip_days:30,price:15000,normal:15000,tag:'UNLIMITED',accent:'vip',desc:'Akses pemakaian tool tanpa potongan credits selama VIP aktif.',benefits:['Unlimited tool usage','Aktif 30 hari','VIP status while active']}
];

const rupiah=n=>`Rp${Number(n||0).toLocaleString('id-ID')}`;
const saving=p=>p.normal?Math.max(0,Math.round((1-p.price/p.normal)*100)):0;

export default function Store({profile}){
 const [busy,setBusy]=React.useState('');
 const [created,setCreated]=React.useState(null);
 const [error,setError]=React.useState('');
 const [products,setProducts]=React.useState(FALLBACK_PRODUCTS);
 const [loadingProducts,setLoadingProducts]=React.useState(true);
 React.useEffect(()=>{let alive=true;(async()=>{try{const rows=await listRows('pricing','?select=id,title,normal_price,promo_price,promo_active,credits,vip_days,description,sort_order,active&active=eq.true&order=sort_order.asc');if(!alive)return;if(Array.isArray(rows)&&rows.length){setProducts(rows.map((p,i)=>({id:p.id,product:p.title,credits:Number(p.credits||0),vip_days:Number(p.vip_days||0),price:Number(p.promo_active?p.promo_price:p.normal_price),normal:Number(p.normal_price||0),tag:i===0?'POPULAR':p.vip_days?'UNLIMITED':i===1?'BEST VALUE':'OFFICIAL',accent:p.vip_days?'vip':'credits',desc:p.description||'Official KING VANDYZ product.',benefits:p.vip_days?['Unlimited tool usage',`${p.vip_days} days active`]:[`${Number(p.credits||0)} purchased credits`,'Tidak kedaluwarsa','Dipakai setelah free credits']})))}}catch{}finally{if(alive)setLoadingProducts(false)}})();return()=>{alive=false}},[]);
 const buy=async p=>{
   if(!profile){setError('Login terlebih dahulu untuk membuat order.');return}
   setBusy(p.id);setError('');
   try{const o=await createOrder(p.product,p.price,p.credits||0,p.vip_days||0);setCreated({...o,p});}
   catch(e){setError(e?.message||'Order gagal dibuat.')}
   finally{setBusy('')}
 };
 const wa=created?`https://wa.me/6283818597706?text=${encodeURIComponent(`KING VANDYZ ORDER\n\nOrder ID: ${created.id}\nUsername: ${profile?.username||'-'}\nProduct: ${created.product}\nPrice: ${rupiah(created.price)}`)}`:'#';
 return <div className="page store-page">
  <section className="market-hero">
   <div className="market-hero-copy">
    <div className="market-kicker"><ShoppingBag size={14}/> KING VANDYZ MARKETPLACE</div>
    <h1>Upgrade your<br/><em>digital toolbox.</em></h1>
    <p>Credits dan VIP resmi KING VANDYZ dalam satu marketplace. Buat order, dapatkan Order ID, lalu lanjutkan konfirmasi pembayaran melalui WhatsApp.</p>
    <div className="market-trust"><span><BadgeCheck size={15}/> REAL ORDER</span><span><ShieldCheck size={15}/> SUPABASE RECORDED</span><span><MessageCircle size={15}/> WHATSAPP SUPPORT</span></div>
   </div>
   <div className="market-hero-card"><div className="market-hero-icon"><Sparkles size={30}/></div><small>STORE STATUS</small><b>OPEN</b><span>Orders can be created now</span></div>
  </section>

  {error&&<div className="error-banner"><ReceiptText size={16}/><span>{error}</span></div>}

  <section className="market-toolbar">
   <div><small>PRODUCT CATALOG</small><h2>Choose your access</h2>{loadingProducts&&<span className="market-loading">Syncing live catalog…</span>}</div>
   <div className="market-count"><b>{products.length}</b><span>official products</span></div>
  </section>

  <section className="market-grid">
   {products.map(p=><article className={`market-product ${p.accent==='vip'?'market-product-vip':''}`} key={p.id}>
    <div className="market-product-head">
      <span className="market-tag">{p.tag}</span>
      <span className="market-product-icon">{p.vip_days?<Crown size={20}/>:<Zap size={20}/>}</span>
    </div>
    <div className="market-product-code">KV / {p.id.toUpperCase()}</div>
    <h3>{p.product}</h3>
    <p>{p.desc}</p>
    <div className="market-price">{p.normal&&<del>{rupiah(p.normal)}</del>}<strong>{rupiah(p.price)}</strong>{p.vip_days&&<span>/ 30 DAYS</span>}</div>
    {saving(p)>0&&<div className="market-save"><Percent size={13}/> SAVE {saving(p)}%</div>}
    <ul className="market-benefits">{p.benefits.map(b=><li key={b}><Check size={14}/>{b}</li>)}</ul>
    <button className="btn primary market-buy" disabled={busy===p.id} onClick={()=>buy(p)}>{busy===p.id?'CREATING ORDER…':'BUY NOW'} <ArrowUpRight size={17}/></button>
    <div className="market-foot"><span><ShieldCheck size={13}/> Secure order record</span><span>{p.vip_days?'30 days':'Never expires'}</span></div>
   </article>)}
  </section>

  <section className="market-comparison">
    <div className="market-section-title"><small>QUICK COMPARISON</small><h2>Pick based on how you use KING VANDYZ.</h2><p>Free credits tetap digunakan lebih dulu. Purchased credits tidak ikut reset.</p></div>
    <div className="market-compare-grid">
      <div><CreditCard/><b>Credits</b><span>Untuk penggunaan tool berbasis credits.</span></div>
      <div><Crown/><b>VIP</b><span>Unlimited usage selama periode VIP aktif.</span></div>
      <div><WalletCards/><b>Order</b><span>Semua pembelian dibuat sebagai order resmi.</span></div>
    </div>
  </section>

  <section className="market-process">
    <div className="market-section-title"><small>HOW CHECKOUT WORKS</small><h2>Simple, clear, recorded.</h2></div>
    <div className="market-steps">
      <div><b>01</b><ShoppingBag/><h3>Choose</h3><p>Pilih Credits atau VIP sesuai kebutuhan.</p></div>
      <div><b>02</b><ReceiptText/><h3>Create Order</h3><p>Order ID dibuat dan dicatat di database.</p></div>
      <div><b>03</b><MessageCircle/><h3>WhatsApp</h3><p>Kirim detail order ke VANDYZ untuk konfirmasi.</p></div>
      <div><b>04</b><Headphones/><h3>Complete</h3><p>Admin memproses order setelah pembayaran dikonfirmasi.</p></div>
    </div>
  </section>

  <section className="market-help"><div><small>NEED HELP?</small><h2>Before you pay, check the Order ID.</h2><p>Jangan kirim pembayaran sebelum detail produk dan Order ID sudah sesuai.</p></div><div className="market-help-badge"><Clock3 size={18}/><span>ORDER FLOW<br/><b>TRANSPARENT</b></span></div></section>

  {created&&<div className="modal-backdrop market-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setCreated(null)}}>
    <div className="order-modal market-order-modal">
      <button className="modal-close" aria-label="Close" onClick={()=>setCreated(null)}>×</button>
      <div className="market-order-label"><BadgeCheck size={15}/> ORDER CREATED</div>
      <h2>{created.product}</h2>
      <p className="market-order-sub">Order berhasil dibuat. Simpan Order ID ini sebelum lanjut ke WhatsApp.</p>
      <div className="market-order-summary"><span>USERNAME</span><b>{profile?.username||'-'}</b><span>PRICE</span><b>{rupiah(created.price)}</b></div>
      <div className="order-id">{created.id}</div>
      <div className="market-order-warning"><ShieldCheck size={16}/><span>Pastikan produk, harga, dan Order ID sudah benar.</span></div>
      <a className="btn primary market-wa-btn" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={18}/> CONTINUE TO WHATSAPP <ArrowUpRight size={16}/></a>
    </div>
  </div>}
 </div>
}
