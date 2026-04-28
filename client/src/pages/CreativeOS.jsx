import { useState, useCallback, useEffect } from "react";

/* ─── PRODUCTS ─── */
const PRODUCTS = [
  /* ── Core products ── */
  {v:"Qoyod Main",   g:"core",ar:"قيود — محاسبة",           color:"#17a3a3",sub:"Accounting + E-Invoice",     trust:"ZATCA Logo",   desc_ar:"نظام محاسبة سحابي سعودي معتمد من ZATCA — فواتير إلكترونية + محاسبة + مخزون + تقارير لحظية",                                                                 desc_en:"Saudi cloud accounting certified by ZATCA — e-invoicing + accounting + inventory + live reports"},
  {v:"QFlavours",    g:"core",ar:"فليفرز — مطاعم وكافيهات", color:"#60a5fa",sub:"F&B POS",                    trust:"ZATCA Phase 2", desc_ar:"نظام إدارة متكامل للمطاعم والكافيهات — كاشير + مخزون + تقارير لحظية + فوترة إلكترونية متوافقة مع هيئة الزكاة والضريبة",                            desc_en:"Integrated F&B management — POS + inventory + live reports + ZATCA-compliant e-invoicing"},
  {v:"QoyodPOS",     g:"core",ar:"قيود POS — تجزئة",        color:"#34d399",sub:"Retail POS",                 trust:"ZATCA Phase 2", desc_ar:"نظام نقاط بيع لقطاع التجزئة — ربط المبيعات بالمحاسبة تلقائياً مع فواتير إلكترونية معتمدة",                                                          desc_en:"Retail POS — automatically links sales to accounting with ZATCA-certified invoicing"},
  {v:"QBookkeeping", g:"core",ar:"مسك الدفاتر",              color:"#a78bfa",sub:"Outsourced Bookkeeping",      trust:"SOCPA",         desc_ar:"خدمة مسك دفاتر باشتراك شهري — فريق محاسبين معتمدين من SOCPA يديرون دفاتر شركتك عن بُعد، دون الحاجة لتوظيف محاسب داخلي بشكل دائم",               desc_en:"Monthly bookkeeping subscription — SOCPA-certified accountants manage your books remotely, no full-time hire needed"},

  /* ── Audience segments ── */
  {v:"Qoyod Accountants",g:"segment",ar:"قيود للمحاسبين",        color:"#06b6d4",sub:"للمحاسبين المحترفين",   trust:"SOCPA",         desc_ar:"قيود للمحاسبين — إدارة ملفات عملاء متعددين من لوحة تحكم واحدة مع تقارير ZATCA جاهزة لكل عميل",   desc_en:"Qoyod for accountants — manage multiple client files from one dashboard with per-client ZATCA reports"},
  {v:"Qoyod Owners",     g:"segment",ar:"قيود لأصحاب الأعمال",   color:"#f59e0b",sub:"Business Owners",       trust:"ZATCA",         desc_ar:"قيود لأصحاب الأعمال — تابع أرقامك وتقاريرك المالية بنفسك من أي جهاز، دون الحاجة لمحاسب في كل خطوة", desc_en:"Qoyod for business owners — monitor your financials yourself from any device, no accountant needed at every step"},

  /* ── Services ── */
  {v:"VAT Services",   g:"service",ar:"خدمات ضريبة القيمة المضافة",color:"#ef4444",sub:"VAT Management",         trust:"ZATCA",         desc_ar:"إدارة ضريبة القيمة المضافة — تسجيل، إعداد الإقرارات الدورية، ومطابقة تلقائية مع هيئة الزكاة والضريبة والجمارك",                                  desc_en:"VAT management — registration, periodic return filing, and auto-reconciliation with ZATCA"},
  {v:"API Integration",g:"service",ar:"التكامل عبر API",            color:"#8b5cf6",sub:"API Integration",         trust:"REST API",       desc_ar:"ربط أنظمتك بمنصة قيود عبر API — أتمتة الفواتير والمخزون والمدفوعات مع أي منصة تجارية أو تطبيق خارجي",                                         desc_en:"Connect your systems to Qoyod via API — automate invoices, inventory and payments with any platform or app"},
  {v:"E-Invoice",      g:"service",ar:"الفاتورة الإلكترونية",       color:"#10b981",sub:"ZATCA Phase 2",          trust:"ZATCA Phase 2", desc_ar:"نظام الفواتير الإلكترونية المرحلة الثانية من ZATCA — إصدار وإرسال وأرشفة تلقائية لكل فاتورة دون تعقيدات تقنية",                               desc_en:"ZATCA Phase 2 e-invoicing — automatically issue, transmit and archive every invoice without technical complexity"},

  /* ── Seasonal offers ── */
  {v:"Offer-Ramadan",    g:"offer",ar:"عرض رمضان",    color:"#f59e0b",sub:"Ramadan Campaign",    trust:"عرض محدود",period:"رمضان",   desc_ar:"عرض رمضان — خصم خاص + دعم على مدار الساعة طوال شهر رمضان المبارك لجميع المشتركين الجدد",           desc_en:"Ramadan offer — exclusive discount + round-the-clock support throughout Ramadan for new subscribers"},
  {v:"Offer-NationalDay",g:"offer",ar:"اليوم الوطني",color:"#16a34a",sub:"National Day 23 Sep", trust:"عرض موسمي",period:"23 سبتمبر",desc_ar:"عرض اليوم الوطني السعودي — خصم احتفالي لجميع الشركات المنضمة خلال موسم اليوم الوطني",                desc_en:"Saudi National Day offer — celebratory discount for all businesses joining during National Day season"},
  {v:"Offer-FoundingDay",g:"offer",ar:"يوم التأسيس", color:"#0ea5e9",sub:"Founding Day 22 Feb", trust:"عرض موسمي",period:"22 فبراير",desc_ar:"عرض يوم التأسيس — سعر تأسيسي خاص للشركات الناشئة والمؤسسين الجدد الراغبين في الانطلاق بشكل احترافي",desc_en:"Founding Day offer — special founding price for startups and new business founders"},
  {v:"Offer-YearEnd",    g:"offer",ar:"نهاية العام",  color:"#a855f7",sub:"Year-End Campaign",   trust:"عرض محدود",period:"ديسمبر",  desc_ar:"عرض نهاية العام — أفضل سعر لإغلاق السنة المالية باحترافية والانطلاق في العام الجديد منظماً",           desc_en:"Year-end offer — best price to close your fiscal year professionally and start the new year organized"},
];

/* ─── FEATURES ─── */
const FEATURES = [
  {v:"zatca",          ar:"الفاتورة الإلكترونية",     desc_ar:"إصدار فواتير إلكترونية معتمدة ZATCA في ثوانٍ — المرحلتان الأولى والثانية",                                desc_en:"Issue ZATCA-certified e-invoices in seconds — Phase 1 and Phase 2 ready"},
  {v:"tax_declaration",ar:"الإقرار الضريبي",          desc_ar:"إعداد وتقديم الإقرارات الضريبية الدورية لضريبة القيمة المضافة بدقة وفي الوقت المحدد دون أخطاء",         desc_en:"Prepare and submit periodic VAT returns accurately and on time without errors"},
  {v:"reports",        ar:"التقارير المالية",          desc_ar:"تقارير يومية وأسبوعية وشهرية — أرباح وخسائر، ميزانية عمومية، وتقارير مخصصة",                            desc_en:"Daily/weekly/monthly reports — P&L, balance sheet, and custom reports"},
  {v:"inventory",      ar:"إدارة المخزون",            desc_ar:"تحكّم كامل في مخزونك — تحديث فوري عند كل عملية بيع أو شراء",                                            desc_en:"Full inventory control — real-time updates on every sale or purchase"},
  {v:"mobile_mgmt",   ar:"إدارة كل شيء من جهازك",  desc_ar:"سيطر على عملك بالكامل من هاتفك أو جهازك اللوحي — في أي وقت ومن أي مكان",                                desc_en:"Run your entire business from your phone or tablet — anytime, anywhere"},
  {v:"integrations",  ar:"الربط الإلكتروني",          desc_ar:"ربط متكامل مع منصات الدفع والبنوك وأنظمة التجارة الإلكترونية",                                           desc_en:"Seamless integration with payment platforms, banks and e-commerce systems"},
  {v:"support",        ar:"الدعم الفني على مدار الساعة",desc_ar:"فريق دعم متاح داخل النظام على مدار الساعة — ردود سريعة وحلول فورية",                                 desc_en:"Support team available in-system around the clock — fast responses, instant solutions"},
  {v:"bookkeeping_pain",ar:"مسك الدفاتر — بدون توظيف دائم",desc_ar:"فريق محاسبين معتمدين من SOCPA يديرون دفاتر شركتك عن بُعد — وفّر تكاليف التوظيف الثابتة",         desc_en:"SOCPA-certified accountants manage your books remotely — save on full-time hiring costs"},
  {v:"budgeting",      ar:"الميزانيات التقديرية",      desc_ar:"ضع ميزانية لكل قسم — تابع الفعلي مقابل المخطط لحظياً واتخذ قرارات مالية مبنية على بيانات",               desc_en:"Set per-department budgets — track actual vs planned in real time for data-driven decisions"},
  {v:"recurring",      ar:"المعاملات المتكررة",        desc_ar:"أتمتة الفواتير والمصروفات المتكررة تلقائياً — لا تفوّت دفعة أو اشتراكاً",                               desc_en:"Automate recurring invoices and expenses — never miss a payment or subscription"},
];

/* ─── SECTORS ─── */
const SECTORS = [
  {v:"General",ar:"عام",en:"General"},{v:"Retail",ar:"التجزئة",en:"Retail"},
  {v:"Restaurant",ar:"المطاعم",en:"F&B"},{v:"RealEstate",ar:"العقارات",en:"Real Estate"},
  {v:"Tech",ar:"التقنية",en:"Tech"},{v:"Law",ar:"المحاماة",en:"Law"},
  {v:"Education",ar:"التعليم",en:"Education"},{v:"Construction",ar:"المقاولات",en:"Construction"},
  {v:"Manufacturing",ar:"المصانع",en:"Manufacturing"},
];

/* ─── COMPETITORS ─── */
const COMPS = [
  {id:"daftra",n:"دفترة",en:"Daftra",lb:"#0047FF",lt:"D",c:"#6699ff",chs:["IG","FB","LI","X","TK"],thr:"high",war:"تعدد رسائل، لهجة مصرية",wae:"Multi-message, Egyptian dialect"},
  {id:"dafater",n:"دفاتر",en:"Dafater",lb:"#e11d48",lt:"D",c:"#f43f5e",chs:["FB","LI","IG"],thr:"mid",war:"ERP فقط، قوة للمخازن",wae:"ERP-focused, inventory-heavy"},
  {id:"foodics",n:"فودكس",en:"Foodics",lb:"#7c3aed",lt:"F",c:"#c084fc",chs:["IG","TK","X","LI"],thr:"high",war:"F&B أساساً — مو شامل",wae:"Primarily F&B only"},
  {id:"rewaa",n:"رواء",en:"Rewaa",lb:"#0f766e",lt:"R",c:"#4dd9b0",chs:["IG","X","TK"],thr:"high",war:"ZATCA+مخزون — ليس محاسبة كاملة",wae:"Strong ZATCA+inventory — not full accounting"},
  {id:"wafeq",n:"وافق",en:"Wafeq",lb:"#0369a1",lt:"W",c:"#67d4ee",chs:["IG","X","LI"],thr:"mid",war:"باقات معقدة، لا POS",wae:"Complex tiers, no POS"},
  {id:"smacc",n:"SMACC",en:"SMACC",lb:"#1e40af",lt:"S",c:"#93c5fd",chs:["IG","FB","LI"],thr:"mid",war:"لا ZATCA أصلي، واجهة قديمة",wae:"No native ZATCA, dated UI"},
  {id:"alostaz",n:"الأستاذ",en:"Al-Ostaz",lb:"#374151",lt:"A",c:"#9ca3af",chs:["FB"],thr:"low",war:"ليس سحابي",wae:"Not cloud-native"},
  {id:"zoho",n:"Zoho/QB",en:"Zoho/QB",lb:"#d97706",lt:"Z",c:"#fbbf24",chs:["LI","FB"],thr:"mid",war:"أجنبي، لا ZATCA أصلي",wae:"Foreign, no native ZATCA"},
];

/* ─── CAMPAIGN REFERENCES ─── */
const CAMPS = [
  {id:"F07",ar:"POS — نقاط البيع تعطيك بيع، قيود يعطيك الصورة المالية الكاملة",en:"POS gives sales, Qoyod gives the full financial picture",s:"POS",st:"TOF"},
  {id:"F15",ar:"تجارة إلكترونية — بدون محاسبة = فوضى",en:"Ecommerce — without accounting = chaos",s:"Ecomm",st:"TOF"},
  {id:"C01",ar:"مسك الدفاتر — فريق SOCPA + منصة قيود = أرقامك تحت السيطرة",en:"Bookkeeping — SOCPA team + Qoyod = numbers under control",s:"BK",st:"MOF"},
  {id:"C03",ar:"مسك الدفاتر — ركّز على نموك واترك مسك الدفاتر علينا",en:"Focus on growth, leave bookkeeping to us",s:"BK",st:"TOF"},
  {id:"BK01",ar:"مسك الدفاتر — كابوس المالي: غرامات التأخير والأخطاء",en:"Financial nightmare: fines and accounting errors",s:"BK",st:"TOF"},
  {id:"C05",ar:"E-Invoice — جهّز تكاملك قبل موعد موجتك",en:"E-Invoice — prepare before your wave deadline",s:"ZATCA",st:"TOF"},
  {id:"C07",ar:"ZATCA — قيود معتمد — جاهز للمرحلة الثانية",en:"ZATCA certified — ready for Phase 2",s:"ZATCA",st:"BOF"},
  {id:"FL01",ar:"فليفرز — أسرع نظام كاشير لإنتاجية أسرع",en:"QFlavours — fastest cashier system for higher productivity",s:"F&B",st:"TOF"},
  {id:"FL02",ar:"فليفرز — أدر مطعمك من جوالك: طلبات + مخزون + فروع",en:"QFlavours — manage your restaurant from your phone",s:"F&B",st:"MOF"},
  {id:"FL03",ar:"فليفرز — إدارة احترافية للمطاعم والمقاهي، من الطلبات للمخزون",en:"QFlavours — professional F&B management",s:"F&B",st:"TOF"},
  {id:"FL04",ar:"فليفرز — شاشة الكاشير + لوحة المطبخ + التقارير من مكان واحد",en:"QFlavours — cashier + kitchen display + reports in one place",s:"F&B",st:"MOF"},
  {id:"RE01",ar:"عقارات — تابع مشاريعك وأصدر تقاريرك بدقة",en:"Real Estate — track projects and issue precise reports",s:"RE",st:"MOF"},
  {id:"RTL01",ar:"تجزئة — اربط نقاط البيع لتقارير دقيقة ومتابعة لحظية",en:"Retail — connect POS for precise reports",s:"Retail",st:"MOF"},
  {id:"TY01",ar:"أسهل فاتورة إلكترونية لأفضل إدارة مالية",en:"Easiest e-invoice for best financial management",s:"قيود",st:"TOF"},
  {id:"TY02",ar:"نظام بسيط لإدارة الأرباح — معتمد من هيئة الزكاة والضريبة والجمارك",en:"Simple profit management — ZATCA certified",s:"قيود",st:"TOF"},
  {id:"TY06",ar:"المرحلة الأخيرة من الفاتورة الإلكترونية بدأت الآن",en:"Final e-invoicing phase has started now",s:"ZATCA",st:"TOF"},
  {id:"TY09",ar:"مسير رواتب تلقائي بالكامل — بدقة وسرعة",en:"Fully automatic payroll — accurate and fast",s:"قيود",st:"MOF"},
  {id:"TY10",ar:"كل أعمالك من جوالك — فواتير وتقارير بضغطة زر",en:"All your business from your phone",s:"قيود",st:"TOF"},
];

/* ─── VISUAL STYLES ─── */
const INSPOS = [
  {v:"device_dashboard",ar:"جهاز + لوحة تحكم",sub:"Device with Qoyod UI",bg:"linear-gradient(135deg,#021544,#01355a)"},
  {v:"2d_character",ar:"شخصية توضيحية بسيطة",sub:"Minimal illustration",bg:"linear-gradient(135deg,#0a1628,#162a52)"},
  {v:"Before_After",ar:"قبل / بعد",sub:"Split Screen",bg:"linear-gradient(135deg,#0047ff,#0035cc)"},
  {v:"Saudi_Person",ar:"شخص سعودي",sub:"9:16 Stories",bg:"linear-gradient(135deg,#1e3a8a,#1e40af)"},
];

/* ─── HOOK TYPES ─── */
const HOOK_TYPES = [
  {v:"Fear",ar:"خوف — مشكلة وعواقبها",en:"Fear — problem & consequences"},
  {v:"Time",ar:"وقت ضائع",en:"Time wasted"},
  {v:"Simplicity",ar:"السهولة — بدون خبرة",en:"Simplicity — no expertise"},
  {v:"Control",ar:"تحكم — اعرف أرباحك",en:"Control — know your profits"},
  {v:"SocialProof",ar:"إثبات اجتماعي — 25,000 شركة",en:"Social Proof — 25K companies"},
  {v:"BeforeAfter",ar:"قبل وبعد — مقارنة",en:"Before/After — comparison"},
  {v:"Auto",ar:"تلقائي — الذكاء الاصطناعي يختار",en:"Auto — AI decides"},
];


/* ─── CREATIVE LIBRARY ─── */
const CREATIVE_LIBRARY = [
  {id:"CR01",category:"فاتورة إلكترونية",funnel:"TOF",format:"4:5",style:"قبل/بعد — ورقة + ZATCA",headline:"الفرق بين الفواتير الورقية والإلكترونية",sub_top:"دقيقة، آمنة، وسهلة المتابعة",sub_bot:"معرضة للأخطاء، والضياع وسهلة التزوير",colors:"أبيض + أزرق داكن + تدرج سماوي",trust:"QOYOD Logo",cta:"qoyod.com",visual:"فاتورة ضريبية بيضاء + QR code على خلفية متدرجة أزرق/سماوي",notes:"تصميم split بدون حواجز — الفاتورة تقطع الخلفية بزاوية"},
  {id:"CR02",category:"فاتورة إلكترونية",funnel:"TOF",format:"1:1",style:"شخصية توضيحية + خلفية بنفسجية",headline:"المرحلة الأخيرة من الفاتورة الإلكترونية",sub_top:"بدأت الآن",colors:"أبيض + بنفسجي فاتح",trust:"QOYOD Logo",cta:"qoyod.com",visual:"رجل يكتب على ورق — flat illustration — بنفسجي/أبيض",notes:"نمط الشخصية المسطحة — ألوان ناعمة — نص كبير يملأ أعلى الإعلان"},
  {id:"CR03",category:"فاتورة إلكترونية",funnel:"BOF",format:"1:1",style:"قبل/بعد — إيصال",headline:"الفاتورة الإلكترونية بضغطة زر!",sub_top:"مع قيود",sub_bot:"في الماضي",colors:"أزرق داكن #021544 + أصفر-أخضر #b5d500",trust:"QOYOD Logo",cta:"ابدأ تجربتك المجانية",visual:"إيصال QOYOD أبيض نظيف (يسار) vs ورق مكتوب يدوياً (يمين)",notes:"اللون الأصفر-أخضر للـ CTA — استخدام بالحملات الترويجية فقط"},
  {id:"CR04",category:"ZATCA / ضريبة",funnel:"TOF",format:"9:16",style:"شخصية توضيحية + خلفية بنفسجية",headline:"إقرارك الضريبي بضغطة زر",colors:"أبيض + بنفسجي متدرج",trust:"QOYOD Logo",cta:"qoyod.com",visual:"رجل يحمل جهازاً لوحياً مع إقرار ضريبي — flat illustration",notes:"نمط 9:16 للقصص — نص كبير أعلى — شخصية أسفل"},
  {id:"CR05",category:"فاتورة إلكترونية",funnel:"MOF",format:"1:1",style:"رسم توضيحي ثلاثي الأبعاد + بنفسجي",headline:"أصدر فاتورتك الإلكترونية بكل سهولة من جوالك",colors:"أبيض + بنفسجي فاتح",trust:"QOYOD Logo",cta:"qoyod.com",visual:"جوال + إيصال يخرج منه + يد تطبع — 3D isometric illustration",notes:"أسلوب ثلاثي الأبعاد ناعم — مناسب للمرحلة الوسطى"},
  {id:"CR06",category:"ZATCA — عاجل",funnel:"TOF",format:"16:9",style:"فاتورة حقيقية + نص عاجل",headline:"لا تأخرها! المرحلة الأخيرة من الفاتورة الإلكترونية بدأت",colors:"أزرق ملكي #021544 + سماوي #17a3a3",trust:"هيئة الزكاة والضريبة والجمارك + QOYOD",cta:"تجربة مجانية",visual:"فاتورة ضريبية حقيقية QOYOD على اليسار — نص عاجل يمين",notes:"شعار هيئة الزكاة ضروري في هذا النوع — يرفع الثقة بشكل كبير"},
  {id:"CR07",category:"ZATCA — عاجل",funnel:"TOF",format:"1:1",style:"فاتورة + لابتوب + نص عاجل",headline:"لا تنتظر! تأكد أن نظامك جاهز للمرحلة الثانية",colors:"أزرق ملكي + سماوي",trust:"هيئة الزكاة والضريبة والجمارك + QOYOD",cta:"ابدأ اليوم وجرّب سهولة إصدار الفواتير مع قيود",visual:"لابتوب MacBook Pro يعرض واجهة قيود + فاتورة تطفو فوقه",notes:"دمج الجهاز الحقيقي مع الفاتورة — أسلوب أكثر احترافية للـ B2B"},
  {id:"CR08",category:"فاتورة إلكترونية",funnel:"BOF",format:"1:1",style:"شخص سعودي حقيقي + جوال",headline:"فواتير إلكترونية أبسط وأسهل لإدارة مالية أدق وأسرع",colors:"أزرق ملكي + سماوي",trust:"هيئة الزكاة والضريبة والجمارك + QOYOD",cta:"اشترك الآن",visual:"شاب سعودي بثوب يمسك جوالاً — خلفية زرقاء متدرجة",notes:"أفضل أداء مع الجمهور السعودي المحلي — الشخص لا يبتسم بشكل مبالغ"},
  {id:"CR09",category:"ZATCA — عاجل",funnel:"TOF",format:"9:16",style:"فاتورة + جوال عاجل",headline:"لا تأجلها! وخلك جاهز للمرحلة الثانية",colors:"أزرق/بنفسجي داكن + سماوي",trust:"هيئة الزكاة والضريبة والجمارك + QOYOD",cta:"اشترك الآن واصدر فواتيرك بكل سهولة",visual:"يد تمسك جوالاً — فاتورة QOYOD + تم الإصدار بنجاح ✓",notes:"عنصر التأكيد ✓ أخضر يرفع الثقة — مناسب جداً للقصص"},
  {id:"CR10",category:"فاتورة إلكترونية",funnel:"MOF",format:"4:5",style:"انفوجرافيك — أسباب",headline:"ليش لازم تتجه إلى الفاتورة الإلكترونية؟",colors:"أبيض + أزرق داكن + سماوي فاتح",trust:"QOYOD Logo",cta:"qoyod.com",visual:"فاتورة حقيقية في المنتصف + 4 أيقونات: تقليل الأخطاء / سرعة الإصدار / متابعة مالية / شفافية",notes:"الانفوجرافيك يؤدي جيداً في LinkedIn وFacebook للجمهور التعليمي"},
  {id:"CR11",category:"ZATCA",funnel:"MOF",format:"4:5",style:"لابتوب + خطوات",headline:"خطوات الاستعداد للمرحلة الثانية من الفاتورة الإلكترونية",colors:"أبيض + أزرق + سماوي",trust:"QOYOD Logo",cta:"qoyod.com",visual:"لابتوب MacBook يعرض ربط قيود بمنصة فاتورة — 3 خطوات بأيقونات ✓",notes:"النمط التعليمي الواضح — مناسب للمرحلة الوسطى + LinkedIn"},
  {id:"CR12",category:"ZATCA — مقارنة",funnel:"TOF",format:"9:16",style:"شخصان سعوديان — قبل/بعد",headline:"غرامة أو التزام؟ القرار عندك",colors:"سماوي فاتح + أزرق داكن",trust:"هيئة الزكاة والضريبة والجمارك + QOYOD",cta:"اشترك في قيود واربط فواتيرك",visual:"شخصان سعوديان: ملتزم (ملون) vs غير ملتزم (أسود وأبيض)",notes:"التناقض اللوني قوي جداً — أحد أكثر الأنماط تأثيراً في إبراز خطر الغرامة"},
  {id:"CR13",category:"فاتورة إلكترونية",funnel:"BOF",format:"1:1",style:"جوال + فاتورة + ثقة",headline:"فواتير إلكترونية متوافقة بالكامل مع متطلبات هيئة الزكاة والضريبة والجمارك",colors:"أبيض + سماوي فاتح متدرج",trust:"هيئة الزكاة والضريبة والجمارك + QOYOD",cta:"اشترك الآن وابدأ رحلتك المحاسبية بثقة",visual:"يد تمسك جوالاً أبيض — فاتورة تخرج منه — تم الإصدار بنجاح ✓",notes:"الخلفية الفاتحة مع السماوي — مريحة للعين — مناسبة للـ BOF"},
  {id:"CR14",category:"برنامج محاسبي",funnel:"BOF",format:"1:1",style:"جوال + شاشة + ثقة",headline:"برنامج قيود المحاسبي — فوترة سهلة وموثوقة",colors:"أبيض + أزرق داكن",trust:"QOYOD Logo",cta:"ابدأ تجربتك المجانية",visual:"يد تمسك جوالاً أمام شاشة كمبيوتر — فاتورة + تم الإصدار بنجاح ✓",notes:"الجمع بين الجهازين (جوال + شاشة) يعكس مرونة النظام السحابي"},
];

/* ─── CONTENT TOPICS ─── */
const CONTENT_TOPICS = [
  {id:"BL01",title_ar:"إدارة الأزمات المالية",title_en:"Financial Crisis Management",source:"مقال قيود",angle_ar:"كيف يحمي قيود منشأتك في أوقات الأزمات المالية",pain_ar:"أصحاب الأعمال خايفين من أزمات مالية مفاجئة — ما عندهم خطة واضحة",hooks_ar:["الأزمة المالية ما تنتظر — هل منشأتك جاهزة؟","كيف تتعامل مع أزمة مالية وشركتك ما تنهار؟","قيود يعطيك الصورة المالية الكاملة — حتى في أصعب الأوقات"],content_angles:["5 علامات تدل أن منشأتك في أزمة مالية قادمة","الفرق بين من نجا من كورونا ومن لم ينجُ — السبب: التخطيط المالي","كيف تبني خطة (ب) لمنشأتك قبل الأزمة لا بعدها","دور التقارير المالية اللحظية في اتخاذ قرارات سريعة وصحيحة"],cta_ar:"جرّب قيود مجاناً 14 يوم — وخذ السيطرة على أرقامك",formats:["مقال","انفوجرافيك","فيديو تعليمي","كاروسيل"],funnel:"TOF",sector:"عام"},
];

/* ─── EXTRA FEATURES ─── */
const FEATURES_EXTRA = [
  {v:"budgeting",ar:"الميزانيات التقديرية",desc_ar:"ضع ميزانية مسبقة لكل قسم أو مشروع — تابع الفعلي مقابل المخطط لحظياً — تنبيهات عند تجاوز الميزانية",hook_ar:"خططت لـ 50,000 ريال — والفعلي وصل 80,000؟ قيود يخبرك قبل فوات الأوان",sector:"عام / مقاولات / تقنية"},
  {v:"bonds",ar:"خطابات الضمان وضمان التنفيذ",desc_ar:"تتبع خطابات الضمان وضمان التنفيذ — تواريخ الانتهاء — التكاليف المرتبطة بكل مشروع",hook_ar:"خطاب ضمانك انتهى وما عرفت؟ قيود يتابعها عنك",sector:"مقاولات / عقارات"},
  {v:"recurring",ar:"المعاملات المتكررة",desc_ar:"أتمتة الفواتير والمصروفات المتكررة — إيجار / رواتب / اشتراكات — تسجيل تلقائي بدون إدخال يدوي",hook_ar:"كل شهر تدخل نفس الفواتير يدوياً؟ قيود يسجلها تلقائياً",sector:"عام / خدمات"},
];

/* ─── QFlavours DATA ─── */
const QFLAVOURS_LP_HEADLINES = [
  {screen:"شاشة الكاشير",headline:"أسرع نظام كاشير، لإنتاجية أسرع",desc:"واجهة بيع بسيطة تناسب كل المطاعم لإتمام تسجيل الطلبات والدفع في ثواني"},
  {screen:"أنواع الطلبات",headline:"كل أنواع طلباتك — من مكان واحد",desc:"سفري، توصيل، محلي، مسار السيارات — فليفرز يدير الكل"},
  {screen:"لوحة التحكم",headline:"تقارير لحظية لكل فرع",desc:"تابع مبيعاتك وإيراداتك وطلباتك فوراً من أي مكان"},
  {screen:"شاشة المطبخ",headline:"المطبخ منظم — الطلبات ما تضيع",desc:"شاشة المطبخ تُرتّب كل طلب حسب الأولوية والوقت تلقائياً"},
  {screen:"إدارة الطاولات",headline:"اختر الطاولة — ابدأ الطلب فوراً",desc:"خريطة الطاولات تُظهر المتاح والمشغول في لحظة"},
];

const QFLAVOURS_CAPTIONS = [
  {id:1,design:"أسهل فاتورة إلكترونية",captions:["سهل إدارة أعمالك بنظام فواتير ذكي وسهل! وأصدر فواتيرك الإلكترونية من جوالك مع #قيود بثواني، وبدون تعقيد.","تحكم بفواتيرك بدون تعقيد مهما كان وقتك مشغول، تقدر تصدرها وأنت بمكانك وبضغطة وحدة. مع نظام #قيود","خل مهامك أسهل، وفوّتر إلكترونيًا من جوالك مع #قيود!"]},
  {id:2,design:"نظام بسيط لإدارة الأرباح",captions:["لاتدير مصاريفك يدويًا واستخدم #قيود، كل التزاماتك الضريبية وإدارتك المالية أسهل من أي وقت.","اضمن نمو أعمالك بتحكم مالي دقيق! مع نظام #قيود المحاسبي اللي يساعدك تتابع الأرباح والمصاريف من مكان واحد.","كل أموالك من مكان واحد، بنظام يسمح لك تتبع كل مصاريفك بكل سهولة. #قيود"]},
  {id:3,design:"نظام يسهل شغلك",captions:["من الفواتير للتقارير للضريبة، كل المهام تخلصها من منصة واحدة مع #قيود.","تقارير مالية دقيقة؟ تخلصها بضغطة زر مع نظام #قيود لاتشيل هم المحاسبة","جرب #قيود الآن، وابدأ تجربتك المجانية واختصر وقتك وجهدك في إدارة مصاريفك."]},
  {id:4,design:"حساب فوق السحاب",captions:["مع #قيود، بياناتك محفوظة سحابياً لضمان السرعة والدقة والأمان.","ليش تخاطر بأمان معلوماتك؟ حول للنظام الذكي الآن. #قيود","نظامك المحاسبي السحابي يحفظ لك كل شيء، بدون قلق أو خسارة. #قيود"]},
  {id:5,design:"ركّز على نمو أعمالك",captions:["لا تنشغل بالضغط، خلّ النظام يشتغل عنك وركز على توسع مشروعك. #قيود","وفر وقتك للقرارات الكبيرة، وخلي #قيود يدير المهام اليومية.","النمو يحتاج تركيز، و#قيود يخلي وقتك لك."]},
  {id:6,design:"المرحلة الأخيرة من الفاتورة الإلكترونية",captions:["آلاف التجار دخلوا المرحلة الثانية للفوترة الإلكترونية مع #قيود، أنت جاهز؟","تقدر تصدر فواتيرك الإلكترونية الآن وتكون جزء من المرحلة الثانية بكل سلاسة! #قيود","لاتخسر أكثر، انضم لآلاف التجار وابدأ بالمرحلة الثانية مع #قيود"]},
  {id:7,design:"كل حلولك المالية بمكان واحد",captions:["من غير ما تضيع بين أنظمة مختلفة، كل أمورك المالية صارت في مكان واحد مع #قيود","#قيود يجمع لك كل شيء: تقارير، فواتير، ضرائب، مبيعات، جرب قيود بشكل مجاني","سهّل على نفسك، وتابع كل شيء من مكان واحد مع نظام #قيود."]},
  {id:8,design:"مسير رواتب تلقائي بالكامل",captions:["وفّر وقتك وجهدك! مع #قيود، رواتب موظفيك تُصرف تلقائيًا بدون تأخير أو أخطاء.","انتهِ من إعداد مسيرات الرواتب بكبسة زر! نظام #قيود يسهلها عليك بالكامل.","لا تحتاج أوراق ولا إدخال يدوي… رواتبك تُدار بشكل تلقائي مع #قيود، بدقة وسرعة."]},
  {id:9,design:"كل أعمالك من جوالك",captions:["#قيود يصدر لك فواتيرك الإلكترونية والتقارير بسهولة ومن خلال التطبيق","لاتشيل هم الفوترة الإلكترونية #قيود يصدرها لك بضغطة زر","عشان تسهل عليك إصدار الفواتير والتقارير، استخدم #قيود وأصدرها بثوان"]},
];

/* ─── ICP PERSONAS ─── */
const ICP_PERSONAS = [
  {id:"P01",title:"CFO / مدير مالي",en:"Chief Financial Officer",icon:"📊",tier:"A",inflection:"نمو سريع + تعدد الفروع + الامتثال الضريبي",pain_ar:"يحتاج بيانات دقيقة لحظية — الامتثال لـ ZATCA يأخذ وقتاً كبيراً",hook_ar:"أرقامك الحقيقية — في ثوانٍ وليس ساعات",message_ar:"تقارير مالية لحظية + امتثال ZATCA تلقائي = قرارات أسرع بثقة أكبر",cta_ar:"شوف قيود من جوالك",funnel:"MOF",channels:["LinkedIn","Google"]},
  {id:"P02",title:"مؤسس / CEO — شركة صغيرة أو متوسطة",en:"Founder / SME CEO",icon:"🚀",tier:"A",inflection:"أول جولة تمويل — مطلوب سجلات مالية دقيقة للمستثمرين والجهات التنظيمية",pain_ar:"ما عنده خبرة محاسبية — يدير المالية بنفسه — يخاف من الأخطاء",hook_ar:"أدر شركتك بدون توظيف محاسب — قيود يعمل عنك",message_ar:"نظام بسيط يناسب المؤسسين — بدون خبرة محاسبية — ابدأ في دقائق",cta_ar:"ابدأ تجربتك المجانية",funnel:"TOF",channels:["Instagram","Snapchat","LinkedIn"]},
  {id:"P03",title:"مدير مالي",en:"Finance Manager",icon:"💼",tier:"A",inflection:"الانتقال من Excel أو برنامج قديم إلى نظام سحابي",pain_ar:"Excel يسبب أخطاء — البرامج القديمة ما تدعم ZATCA — يريد أتمتة",hook_ar:"وقتك أغلى من إدخال بيانات يدوي",message_ar:"استبدل Excel بنظام محاسبي سحابي — أتمتة كاملة — تقارير بضغطة زر",cta_ar:"جرّب قيود اليوم",funnel:"MOF",channels:["LinkedIn","Google"]},
  {id:"P04",title:"صاحب متجر إلكتروني",en:"E-Commerce Owner",icon:"🛒",tier:"A",inflection:"توسع المتجر + تحديات في إدارة المخزون والمبيعات والمحاسبة",pain_ar:"مخزون متشعب — فواتير يدوية — ما يعرف ربحيته الحقيقية",hook_ar:"كم ربحت اليوم فعلاً؟ قيود يجاوبك فوراً",message_ar:"ربط POS بالمحاسبة تلقائياً — مخزون لحظي — ربحية واضحة",cta_ar:"ابدأ تجربتك المجانية",funnel:"TOF",channels:["Instagram","TikTok","Snapchat"]},
  {id:"P05",title:"مدير العمليات",en:"Operations Manager",icon:"⚙️",tier:"B",inflection:"الفوضى في تتبع المصروفات والعمليات تبطئ الإنتاجية",pain_ar:"لا مركزية — مصروفات مبعثرة — تقارير متأخرة",hook_ar:"كل عملياتك المالية من مكان واحد",message_ar:"مركزة العمليات + تتبع المصروفات + تعاون سلس بين الأقسام",cta_ar:"احجز عرضاً",funnel:"MOF",channels:["LinkedIn","Google"]},
  {id:"P06",title:"محاسب / مسك دفاتر",en:"Accountant / Bookkeeper",icon:"🧾",tier:"A",inflection:"حجم المعاملات كبر — الطرق اليدوية ما تكفي",pain_ar:"ساعات في إدخال بيانات يدوي — أخطاء متكررة — ضغط في نهاية الشهر",hook_ar:"خل قيود يدخل الأرقام — وأنت تركز على التحليل",message_ar:"أتمتة المعاملات المتكررة + امتثال تلقائي + توفير ساعات شهرياً",cta_ar:"جرّب قيود اليوم",funnel:"MOF",channels:["LinkedIn","Facebook"]},
  {id:"P07",title:"صاحب محل تجزئة",en:"Retail Business Owner",icon:"🏪",tier:"A",inflection:"توسع لعدة فروع — يحتاج نظام يجمع المبيعات والمخزون والمالية",pain_ar:"كل فرع بنظام منفصل — مخزون غير متزامن — تقارير يدوية",hook_ar:"أي فرع يربح فعلاً؟ قيود يجاوبك",message_ar:"إدارة متعددة الفروع — مخزون موحد — تقارير لكل فرع ولكل الفروع",cta_ar:"ابدأ تجربتك المجانية",funnel:"TOF",channels:["Instagram","Snapchat","TikTok"]},
  {id:"P08",title:"مستشار ضريبي / مسؤول الامتثال",en:"Tax Consultant",icon:"⚖️",tier:"B",inflection:"تحضير للتدقيق السنوي أو الإقرار الضريبي",pain_ar:"السجلات غير منظمة — مخاطر الغرامات — وقت التدقيق يسبب ضغطاً",hook_ar:"سجلات جاهزة للتدقيق — في أي وقت",message_ar:"فواتير متوافقة مع ZATCA — سجلات منظمة — تقليل مخاطر الغرامات",cta_ar:"شوف قيود من جوالك",funnel:"BOF",channels:["LinkedIn","Google"]},
  {id:"P09",title:"مستشار أعمال للـ SMEs",en:"SME Business Consultant",icon:"🤝",tier:"B",inflection:"يساعد عميلاً على تطوير عملياته — بما فيها برنامج محاسبة",pain_ar:"يبحث عن برنامج موثوق يوصي به لعملائه",hook_ar:"أوصِ عملاءك بالنظام الذي يثق به 25,000+ شركة سعودية",message_ar:"قيود — الخيار الأول للـ SMEs السعودية — ZATCA معتمد — دعم عربي كامل",cta_ar:"احجز عرضاً لعملائك",funnel:"BOF",channels:["LinkedIn"]},
  {id:"P10",title:"مؤسس شركة ناشئة",en:"Startup Founder",icon:"💡",tier:"B",inflection:"أطلق أول منتج — يولّد إيرادات — يحتاج محاسبة أساسية",pain_ar:"يريد حل بسيط ورخيص — ما عنده وقت لتعلم برامج معقدة",hook_ar:"ابدأ في دقائق — بدون خبرة محاسبية ولا بطاقة بنكية",message_ar:"باقة مناسبة للناشئة — سهل الاستخدام — ينمو مع شركتك",cta_ar:"ابدأ تجربتك المجانية",funnel:"TOF",channels:["Instagram","Twitter","LinkedIn"]},
];

/* ─── AD MOCKUP SVG ─── */
/* ─── QOYOD BRAND IDENTITY (injected into AI prompts) ─── */
const QOYOD_VOICE = `QOYOD VOICE (apply to all copy):
- Engaging: informative, personalized, builds trust.
- Confident: believes in itself, communicates value, not afraid to take risks.
- Professional & Clear: polished, articulate, transparent, accurate.
- Fazeea (فزعة): gives more than expected, always strives to serve.
Brand essence: Saudi cloud accounting, born 2016, ZATCA-accredited, no downloads, runs on any device any browser.
Brand values: Fazaa, Empowerment, Sustainability & Growth, Excellence, Innovation.`;

const QOYOD_DESIGN = `QOYOD DESIGN SYSTEM (must be followed in every brief / spec / direction):
- Primary palette: Navy #021544 (main), Deep Turquoise #01355A, Accent Turquoise #17A3A4.
- Sub-product colors: QTahseel = Green, QLend = Blue, QAcademy = Orange, QBookkeeping = Purple. Use the matching color for sub-product creatives.
- Typography: Lama Sans for both Arabic and English (fallback IBM Plex Sans Arabic). Bold for headlines, Medium for subheads, Regular for body.
- Gradient: 45° from top-right to bottom-left, navy → deep turquoise (or deep turquoise → white).
- Layout grid: text upper-right, photos/visuals lower-left, logo lower-right, URL lower-left.
- Square key element: use sparingly — 50% opacity ("soft light") OR outline only.
- Logo rules: never distort, rotate, recolor, add filters/shadows, or place inside a box. Maintain 4× clear space around logo. Min size 15mm.
- Arabic text MUST be right-aligned (RTL). All creative output must be mobile-first — readable on phone screens, tap targets ≥44px, no critical content cut off in safe zones.
- Color balance: background 40% / content 30% / header 20% / others 10% (primary layout).`;

const QOYOD_HTML = `MOBILE-FIRST HTML OUTPUT RULES (mandatory for landing pages):
- <!DOCTYPE html> with <html lang="ar" dir="rtl"> for Arabic, <meta name="viewport" content="width=device-width, initial-scale=1.0">.
- Mobile-first CSS: write base styles for ≤480px first, then @media (min-width:768px) tablet, (min-width:1024px) desktop.
- Tap targets: all buttons/links min-height 48px, generous padding. Font on body: min 16px (prevents iOS zoom). Headlines min 28px mobile / 40px+ desktop. line-height ≥1.5 for Arabic.
- Images/icons: inline SVG or CSS shapes only — no external <img> URLs.
- Forms: full-width inputs on mobile, stacked vertically. Submit button full-width with brand gradient.
- Font: IBM Plex Sans Arabic from Google Fonts: <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">.

REFERENCE DESIGN SYSTEM (match exactly — this is the live Qoyod brand system, validated across 4 production landing pages):
:root {
  --navy:#021544; --navy-deep:#010B2A; --turq-dark:#01355A; --blue:#13778D;
  --turq:#17A3A4; --turq-soft:#CFECEC; --turq-50:#EAF6F6;
  --ink:#0B1220; --ink-soft:#2A3345; --muted:#6B7280; --line:#E4E8EE;
  --bg:#FFFFFF; --bg-soft:#F7FAFB;
  --radius-xl:24px; --radius-lg:18px; --radius-md:12px;
  --shadow-card:0 10px 30px rgba(2,21,68,.08),0 2px 6px rgba(2,21,68,.04);
  --shadow-pop:0 24px 60px rgba(2,21,68,.18);
  --grad-primary:linear-gradient(225deg,var(--navy) 0%,var(--turq-dark) 100%);
  --grad-accent:linear-gradient(225deg,var(--blue) 0%,var(--turq) 100%);
}

LOGO PATTERN (CSS-only, no img tags): Use one of these two patterns:
  Option A (wordmark): <div class="logo-mark"></div><div><div class="logo-word">قيود<span class="accent">.</span></div><div class="logo-sub">ZATCA CERTIFIED</div></div>
  .logo-mark{width:38px;height:38px;border-radius:10px;background:var(--navy);display:grid;place-items:center;position:relative;}
  .logo-mark::after{content:"";position:absolute;width:14px;height:14px;background:var(--turq);border-radius:3px;bottom:7px;right:7px;}
  .logo-word{font-weight:700;font-size:22px;color:var(--navy);letter-spacing:-.5px;}
  .logo-sub{font-size:10px;color:var(--turq);font-weight:600;letter-spacing:1px;}

EYEBROW VARIANTS (choose based on campaign angle):
  Standard (value/feature): .eyebrow { background:var(--turq-50);color:var(--turq-dark);border:1px solid var(--turq-soft);padding:7px 16px;border-radius:100px;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:8px; }
  Urgent (ZATCA deadlines, time-limited offers): .eyebrow-urgent { background:#FFF4E5;color:#8B4513;border:1px solid #FFCC99;border-radius:100px;padding:7px 16px;display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:13px; }
  Urgent dot: .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#D97706;animation:pulse 1.6s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  USE URGENT EYEBROW for: ZATCA phase deadlines, Ramadan/seasonal offers, limited-time trials, compliance urgency campaigns.

BUTTON PATTERN:
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:12px;font-weight:600;font-size:15px;border:none;cursor:pointer;transition:transform .15s ease,box-shadow .2s ease,background .2s;font-family:inherit;}
  .btn-primary{background:var(--navy);color:#fff;box-shadow:0 6px 16px rgba(2,21,68,.25);}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(2,21,68,.35);background:var(--turq-dark);}
  .btn-lg{padding:15px 30px;font-size:16px;border-radius:14px;}

FEATURE CARDS:
  .f-card{background:#fff;border-radius:var(--radius-xl);padding:30px 24px;border:1px solid var(--line);transition:.3s cubic-bezier(.2,.7,.3,1);}
  .f-card:hover{transform:translateY(-6px);box-shadow:var(--shadow-pop);border-color:var(--turq-soft);}
  .f-icon{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;margin-bottom:20px;background:var(--turq-50);color:var(--turq-dark);}
  .f-icon svg{width:26px;height:26px;}
  4-column grid desktop, 2-col tablet, 1-col mobile.

HOW IT WORKS CARDS:
  .how-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius-xl);padding:32px 28px;position:relative;}
  .how-num{position:absolute;top:-20px;right:28px;width:48px;height:48px;border-radius:12px;background:var(--grad-primary);color:#fff;display:grid;place-items:center;font-weight:700;font-size:19px;box-shadow:0 8px 20px rgba(2,21,68,.3);}
  3-column grid desktop, 1-col mobile.

PRICING CARDS:
  .price-card{background:#fff;border:1.5px solid var(--line);border-radius:var(--radius-xl);padding:36px 30px;display:flex;flex-direction:column;}
  .price-card.featured{border-color:var(--turq);background:linear-gradient(180deg,#fff 0%,var(--turq-50) 100%);box-shadow:var(--shadow-pop);}
  .price-badge{position:absolute;top:-13px;right:30px;background:var(--grad-primary);color:#fff;padding:6px 14px;border-radius:100px;font-size:12px;font-weight:700;}
  .price-amt{font-size:44px;font-weight:700;color:var(--navy);line-height:1;}
  3-column grid desktop.

TESTIMONIAL:
  .testi-card{max-width:880px;margin:0 auto;background:#fff;border-radius:var(--radius-xl);padding:48px 44px;box-shadow:var(--shadow-card);border:1px solid var(--line);}
  .testi-text{font-size:19px;line-height:1.85;font-weight:500;}
  .testi-avatar{width:52px;height:52px;border-radius:50%;background:var(--grad-primary);display:grid;place-items:center;color:#fff;font-weight:700;}

CTA BAND:
  .cta-box{max-width:1100px;margin:0 auto;background:var(--grad-primary);border-radius:var(--radius-xl);padding:60px 48px;text-align:center;color:#fff;position:relative;overflow:hidden;}
  .cta-box::before{content:"";position:absolute;top:-60px;left:-60px;width:260px;height:260px;background:#fff;opacity:.06;border-radius:32px;transform:rotate(14deg);}
  .cta-box::after{content:"";position:absolute;bottom:-80px;right:-40px;width:300px;height:300px;background:var(--turq);opacity:.14;border-radius:40px;transform:rotate(-18deg);}
  Button inside CTA band: background:#fff;color:var(--navy); hover → background:var(--turq);color:#fff.

SECTION HEADER PATTERN:
  .sec-eyebrow{display:inline-block;background:var(--turq-50);color:var(--turq-dark);padding:6px 16px;border-radius:100px;font-weight:600;font-size:13px;margin-bottom:14px;border:1px solid var(--turq-soft);}
  .sec-title{font-size:clamp(28px,3.5vw,40px);font-weight:700;color:var(--navy);letter-spacing:-.3px;}
  .sec-sub{font-size:17px;color:var(--ink-soft);}

FORM FIELDS:
  border:1.5px solid var(--line);border-radius:12px;padding:13px 14px;font-size:15px;background:var(--bg-soft);transition:border-color .2s,background .2s,box-shadow .2s;
  Focus: border-color:var(--turq);background:#fff;box-shadow:0 0 0 3px rgba(23,163,164,.12);
  Hero form card: background:#fff;border-radius:var(--radius-xl);box-shadow:var(--shadow-pop);padding:34px;border:1px solid var(--line); ::before pseudo glow var(--grad-primary) blur 24px opacity .18.
  Phone input: grid(110px 1fr) gap 8px — country code select + phone input.
  Form 2-col grid for name fields, 2-col for phone+email, single for city/company.

FAQ: use <details>/<summary> elements — no JS needed.
  summary{font-weight:600;cursor:pointer;padding:18px 0;} details[open]{border-color:var(--turq);}

NAVIGATION:
  Sticky, z-index:50, background:rgba(255,255,255,.95), backdrop-filter:blur(14px), border-bottom:1px solid var(--line).
  Links: font-weight:500;color:var(--ink-soft); hover: color:var(--navy). Hide nav links at max-width:900px.

FOOTER: var(--navy-deep) background, 4-column grid (1.5fr 1fr 1fr 1fr), footer links, copyright bar with 1px rgba white border-top.`;

function Mockup({hl="",hk="",ct="",ratio="1:1",prod="Qoyod Main",variant=1}){
  const sizes={"1:1":[240,240],"4:5":[240,300],"9:16":[180,320],"16:9":[300,168]};
  const [w,h]=sizes[ratio]||[240,240];
  const bg1=prod==="QBookkeeping"?"#0c1a6b":prod==="QFlavours"?"#0a1628":prod==="QoyodPOS"?"#042d1a":"#021544";
  const bg2=prod==="QBookkeeping"?"#1a2db5":prod==="QFlavours"?"#0f2352":prod==="QoyodPOS"?"#065f35":"#01355a";
  const ac=prod==="QBookkeeping"?"#f5a623":prod==="QFlavours"?"#60a5fa":prod==="QoyodPOS"?"#34d399":"#17a3a3";
  const h2=(hl||"").slice(0,32),h3=(hk||"").slice(0,38),c2=(ct||"ابدأ الآن").slice(0,14);
  const uid=`${w}x${h}v${variant}`;
  const isNarrow=w<200,fs1=isNarrow?11:12.5,fs2=isNarrow?7.5:8,pad=isNarrow?8:10;
  const maxC1=isNarrow?12:18,maxC2=isNarrow?18:32;
  const btnW=isNarrow?70:84,btnH=isNarrow?20:22,btnFS=isNarrow?7.5:8.5;
  if(variant===2){
    return(
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`v2bg${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={bg1}/><stop offset="100%" stopColor={bg2}/></linearGradient>
          <linearGradient id={`v2btn${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={ac}/><stop offset="100%" stopColor="#13778d"/></linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#v2bg${uid})`}/>
        <circle cx={Math.round(w*.25)} cy={Math.round(h*.65)} r={Math.round(w*.38)} fill={ac} opacity=".07"/>
        <circle cx={Math.round(w*.22)} cy={Math.round(h*.52)} r="20" fill={ac} opacity=".9"/>
        <rect x={Math.round(w*.13)} y={Math.round(h*.56)} width="18" height="24" rx="4" fill={ac} opacity=".8"/>
        <rect x={Math.round(w*.22)} y={Math.round(h*.56)} width="18" height="24" rx="4" fill={ac} opacity=".8"/>
        <text x={w-pad} y={Math.round(h*.15)} fontSize="15" fill="white" fontWeight="700" textAnchor="end" fontFamily="sans-serif">{h2.slice(0,14)}</text>
        {h2.length>14&&<text x={w-pad} y={Math.round(h*.15+18)} fontSize="15" fill="white" fontWeight="700" textAnchor="end" fontFamily="sans-serif">{h2.slice(14,28)}</text>}
        <text x={w-pad} y={Math.round(h*.82)} fontSize="8.5" fill={ac} textAnchor="end" fontFamily="sans-serif">{h3.slice(0,30)}</text>
        <rect x={Math.round(w/2-42)} y={Math.round(h*.87)} width="84" height="21" rx="10" fill={`url(#v2btn${uid})`}/>
        <text x={w/2} y={Math.round(h*.87+13)} fontSize="8" fill="white" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">{c2}</text>
        <text x={w-8} y={h-7} fontSize="7" fill="rgba(255,255,255,.25)" textAnchor="end" fontFamily="sans-serif">QOYOD</text>
      </svg>
    );
  }
  const lh=Math.round(h*.14);
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g1${uid}`} x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={bg1}/><stop offset="100%" stopColor={bg2}/></linearGradient>
        <linearGradient id={`g2${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={ac}/><stop offset="100%" stopColor="#13778d"/></linearGradient>
        <linearGradient id={`g3${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,.08)"/><stop offset="100%" stopColor="rgba(255,255,255,.01)"/></linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#g1${uid})`}/>
      <circle cx={Math.round(w*.12)} cy={Math.round(h*.12)} r={Math.round(w*.35)} fill="rgba(23,163,164,.04)"/>
      <rect x={pad} y={Math.round(h*.44)} width={Math.round(w*.82)} height={Math.round(h*.28)} rx="7" fill={`url(#g3${uid})`} stroke="rgba(23,163,164,.25)" strokeWidth="1.5"/>
      <rect x={pad+8} y={Math.round(h*.47)} width={Math.round(w*.32)} height="4" rx="2" fill={ac} opacity=".55"/>
      <rect x={pad+8} y={Math.round(h*.47+10)} width={Math.round(w*.42)} height="3" rx="1.5" fill="rgba(255,255,255,.15)"/>
      <rect x={pad+8}  y={Math.round(h*.63)} width="8" height="14" rx="2" fill={ac} opacity=".35"/>
      <rect x={pad+20} y={Math.round(h*.61)} width="8" height="16" rx="2" fill={ac} opacity=".55"/>
      <rect x={pad+32} y={Math.round(h*.58)} width="8" height="19" rx="2" fill={ac} opacity=".75"/>
      <rect x={pad+44} y={Math.round(h*.55)} width="8" height="22" rx="2" fill={ac}/>
      <text x={w-pad} y={lh} fontSize={fs1} fill="white" fontWeight="700" textAnchor="end" fontFamily="sans-serif">{h2.slice(0,maxC1)}</text>
      {h2.length>maxC1&&<text x={w-pad} y={lh+fs1+3} fontSize={fs1} fill="white" fontWeight="700" textAnchor="end" fontFamily="sans-serif">{h2.slice(maxC1,maxC1*2)}</text>}
      {h2.length>maxC1*2&&<text x={w-pad} y={lh+(fs1+3)*2} fontSize={fs1} fill="white" fontWeight="700" textAnchor="end" fontFamily="sans-serif">{h2.slice(maxC1*2,maxC1*3)}</text>}
      <text x={w-pad} y={Math.round(h*.38)} fontSize={fs2} fill="rgba(255,255,255,.42)" textAnchor="end" fontFamily="sans-serif">{h3.slice(0,maxC2)}</text>
      <rect x={w-pad-32} y={Math.round(h*.40)} width="32" height="12" rx="4" fill="rgba(245,166,35,.12)" stroke="rgba(245,166,35,.28)" strokeWidth="1"/>
      <text x={w-pad-16} y={Math.round(h*.40+8)} fontSize="5.5" fill="#f5a623" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">ZATCA ✓</text>
      <rect x={Math.round(w/2-btnW/2)} y={Math.round(h*.83)} width={btnW} height={btnH} rx={Math.round(btnH/2)} fill={`url(#g2${uid})`}/>
      <text x={w/2} y={Math.round(h*.83+btnH*.64)} fontSize={btnFS} fill="white" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">{c2}</text>
      <text x={w-pad} y={h-6} fontSize="6.5" fill="rgba(255,255,255,.25)" textAnchor="end" fontFamily="sans-serif">QOYOD</text>
    </svg>
  );
}

/* ─── DEVICE MOCKUP SVG ─── */
function DeviceMockup({screen="dashboard",prod="QFlavours",w=320,h=240}){
  const isFl=prod==="QFlavours";
  const uiBg=isFl?"#f5f6fa":"#0a1f3d",uiHdr=isFl?"#1e1b4b":"#021544";
  const uiAcc=isFl?"#4f46e5":"#17a3a3",uiSub=isFl?"#6b7280":"#6a96aa";
  const uiTxt=isFl?"#1e1b4b":"#ddeef4";
  const uid=`dm${w}${h}${prod}${screen}`;
  if(screen==="cashier"){
    return(
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width={w} height={h} rx="12" fill="#1a1a2e" stroke="#f97316" strokeWidth="2"/>
        <rect x="6" y="6" width={w-12} height={h-12} rx="8" fill={uiBg}/>
        <rect x="6" y="6" width={w-12} height="22" rx="8" fill={uiHdr}/>
        <rect x="6" y="18" width={w-12} height="10" fill={uiHdr}/>
        <text x={w-16} y="21" fontSize="7" fill="white" fontWeight="700" textAnchor="end" fontFamily="sans-serif">شاشة الكاشير</text>
        <rect x="6" y="28" width={w-12} height="14" fill="white" stroke="#e5e7eb" strokeWidth=".5"/>
        {["جميع المنتجات","برغر","مشروبات","كيك"].map((cat,i)=>(
          <g key={i}>
            <rect x={Math.round(w*.08)+i*Math.round(w*.22)} y="30" width={Math.round(w*.2)} height="10" rx="5" fill={i===0?uiAcc:"#f3f4f6"} stroke={i===0?"none":"#e5e7eb"} strokeWidth=".5"/>
            <text x={Math.round(w*.08)+i*Math.round(w*.22)+Math.round(w*.1)} y="37" fontSize="5" fill={i===0?"white":uiSub} textAnchor="middle" fontFamily="sans-serif">{cat}</text>
          </g>
        ))}
        {[{n:"Burgers",p:"20.00"},{n:"Deep-fried Oreos",p:"5.00"},{n:"Salted Caramel",p:"10.00"}].map((item,i)=>{
          const cx=Math.round(w*.08)+i*Math.round(w*.3);
          return(
            <g key={i}>
              <rect x={cx} y="46" width={Math.round(w*.27)} height={Math.round(h*.35)} rx="5" fill="white" stroke="#e5e7eb" strokeWidth=".8"/>
              <rect x={cx+Math.round(w*.035)} y="52" width={Math.round(w*.2)} height={Math.round(h*.12)} rx="3" fill={uiAcc} opacity=".15"/>
              <text x={cx+Math.round(w*.135)} y="74" fontSize="5.5" fill={uiTxt} fontWeight="600" textAnchor="middle" fontFamily="sans-serif">{item.n}</text>
              <text x={cx+Math.round(w*.135)} y="82" fontSize="5" fill={uiAcc} textAnchor="middle" fontFamily="sans-serif">﷼ {item.p}</text>
              <rect x={cx+Math.round(w*.04)} y="86" width={Math.round(w*.19)} height="9" rx="4" fill={uiAcc}/>
              <text x={cx+Math.round(w*.135)} y="92.5" fontSize="5" fill="white" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">+ اضف</text>
            </g>
          );
        })}
        <rect x="6" y={Math.round(h*.57)} width={w-12} height={Math.round(h*.29)} fill="white" stroke="#e5e7eb" strokeWidth=".5"/>
        <text x="14" y={Math.round(h*.62)} fontSize="7" fontWeight="700" fill={uiAcc} fontFamily="sans-serif">﷼ 35.00</text>
        <rect x="6" y={Math.round(h*.87)} width={Math.round((w-12)*.48)} height={Math.round(h*.1)} rx="5" fill="#374151"/>
        <text x={Math.round(w*.25)} y={Math.round(h*.93)} fontSize="6.5" fill="white" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">ادفع لاحقًا</text>
        <rect x={Math.round(w*.52)} y={Math.round(h*.87)} width={Math.round((w-12)*.48)} height={Math.round(h*.1)} rx="5" fill={uiAcc}/>
        <text x={Math.round(w*.76)} y={Math.round(h*.93)} fontSize="6.5" fill="white" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">ادفع الآن</text>
      </svg>
    );
  }
  if(screen==="kitchen"){
    return(
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <rect width={w} height={h} rx="12" fill="#1a1a2e" stroke="#f97316" strokeWidth="2"/>
        <rect x="6" y="6" width={w-12} height={h-12} rx="8" fill={uiBg}/>
        <rect x="6" y="6" width={w-12} height="20" rx="8" fill={uiHdr}/>
        <rect x="6" y="16" width={w-12} height="10" fill={uiHdr}/>
        <text x={w/2} y="19" fontSize="7" fill="white" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">شاشة المطبخ</text>
        {[{label:"انتظار",color:"#f97316",id:"#0006",item:"Salted Caramel x1"},{label:"قيد التنفيذ",color:"#4f46e5",id:"#0005",item:"Deep-fried Oreos x1"},{label:"مكتمل",color:"#22c55e",id:"#0001",item:"Burgers x1"}].map((col,ci)=>{
          const cw=Math.round((w-18)/3),cx=6+ci*(cw+3);
          return(
            <g key={ci}>
              <rect x={cx} y="28" width={cw} height={h-34} rx="5" fill="white" stroke="#e5e7eb" strokeWidth=".8"/>
              <rect x={cx+2} y="30" width={cw-4} height="12" rx="3" fill={`${col.color}22`}/>
              <text x={cx+cw/2} y="38" fontSize="6" fill={col.color} fontWeight="700" textAnchor="middle" fontFamily="sans-serif">{col.label}</text>
              <rect x={cx+2} y="46" width={cw-4} height="32" rx="4" fill={`${col.color}11`} stroke={`${col.color}44`} strokeWidth=".8"/>
              <text x={cx+cw/2} y="56" fontSize="6" fill={col.color} fontWeight="700" textAnchor="middle" fontFamily="sans-serif">{col.id}</text>
              <text x={cx+cw/2} y="65" fontSize="5" fill={uiTxt} textAnchor="middle" fontFamily="sans-serif">{col.item}</text>
            </g>
          );
        })}
      </svg>
    );
  }
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id={`dbg${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#021544"/><stop offset="100%" stopColor="#0a1f3d"/></linearGradient></defs>
      <rect x="2" y="2" width={w-4} height={h-4} rx="14" fill="#1a2744" stroke="#2a3a6a" strokeWidth="2"/>
      <rect x="10" y="10" width={w-20} height={h-20} rx="10" fill="#021544"/>
      <rect x="16" y="16" width={w-32} height="20" rx="5" fill="rgba(255,255,255,.04)"/>
      <rect x="22" y="21" width="40" height="8" rx="3" fill="#17a3a3" opacity=".7"/>
      {[0,1,2,3].map(i=>{const cw=Math.round((w-40)/4)-4,cx=16+i*(cw+5);return(<g key={i}><rect x={cx} y="44" width={cw} height="40" rx="6" fill="rgba(255,255,255,.05)" stroke="rgba(23,163,164,.15)" strokeWidth="1"/><rect x={cx+6} y="59" width={cw-30} height="10" rx="3" fill="#17a3a3" opacity={0.3+i*.15}/></g>);})}
      {[0,1,2,3,4,5,6].map(i=>{const bh=10+Math.round(Math.abs(Math.sin(i+1))*18),bx=16+i*Math.round((w*.52)/7);return <rect key={i} x={bx} y={h-32-bh} width={Math.round((w*.52)/8)} height={bh} rx="3" fill="#17a3a3" opacity={0.3+i*.1}/>;} )}
      <text x={w-14} y={h-6} fontSize="7" fill="rgba(255,255,255,.2)" textAnchor="end" fontFamily="sans-serif">qoyod.com</text>
    </svg>
  );
}

/* ─── UI PRIMITIVES ─── */
function Btn({ch,onClick,gold,line,xs,full,dis,style={}}){
  const base={padding:xs?"3px 8px":"9px 16px",borderRadius:xs?5:7,border:"none",fontFamily:"inherit",fontSize:xs?11:12.5,fontWeight:600,cursor:dis?"default":"pointer",opacity:dis?0.35:1,width:full?"100%":"auto",transition:"all .15s",...style};
  if(xs||line)return<button style={{...base,border:"1px solid rgba(1,53,90,.45)",background:"transparent",color:"#6a96aa"}}onClick={onClick}>{ch}</button>;
  if(gold)return<button style={{...base,background:"linear-gradient(135deg,#f5a623,#e8941a)",color:"#03050a"}}onClick={onClick}disabled={dis}>{ch}</button>;
  return<button style={{...base,background:"linear-gradient(135deg,#17a3a3,#13778d)",color:"#fff"}}onClick={onClick}disabled={dis}>{ch}</button>;
}
function Tag({ch,t,g,green,red,style={}}){
  const base={padding:"2px 8px",borderRadius:4,fontSize:10,display:"inline-block",...style};
  if(t)return<span style={{...base,background:"rgba(23,163,164,.1)",color:"#17a3a3",border:"1px solid rgba(23,163,164,.2)"}}>{ch}</span>;
  if(g)return<span style={{...base,background:"rgba(245,166,35,.1)",color:"#f5a623",border:"1px solid rgba(245,166,35,.2)"}}>{ch}</span>;
  if(green)return<span style={{...base,background:"rgba(93,200,122,.07)",color:"#5dc87a",border:"1px solid rgba(93,200,122,.2)"}}>{ch}</span>;
  if(red)return<span style={{...base,background:"rgba(255,100,100,.06)",color:"#f07070",border:"1px solid rgba(255,100,100,.18)"}}>{ch}</span>;
  return<span style={{...base,background:"#0a1f3d",color:"#6a96aa",border:"1px solid rgba(1,53,90,.45)"}}>{ch}</span>;
}
function Seg({ch,on,onClick,gold}){
  return<button onClick={onClick} style={{padding:"4px 11px",borderRadius:5,fontFamily:"inherit",fontSize:11,cursor:"pointer",transition:"all .15s",border:`1px solid ${on?(gold?"rgba(245,166,35,.4)":"rgba(23,163,164,.5)"):"rgba(1,53,90,.45)"}`,background:on?(gold?"rgba(245,166,35,.1)":"rgba(23,163,164,.1)"):"transparent",color:on?(gold?"#f5a623":"#17a3a3"):"#2e5468",fontWeight:on?600:400}}>{ch}</button>;
}
function Fld({label,children,style={}}){
  return<div style={{marginBottom:12,...style}}><label style={{display:"block",fontSize:10,fontWeight:600,color:"#2e5468",marginBottom:4,letterSpacing:".04em",textTransform:"uppercase"}}>{label}</label>{children}</div>;
}
function SBar({v}){
  const col=v>=80?"#5dc87a":v>=60?"#f5a623":v>=40?"#17a3a3":"#f07070";
  return<div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}><div style={{flex:1,height:3,borderRadius:2,background:"rgba(255,255,255,.05)",overflow:"hidden"}}><div style={{height:"100%",width:`${v}%`,background:col,borderRadius:2}}/></div><span style={{fontSize:10,fontWeight:700,color:col,minWidth:26}}>{v}%</span></div>;
}
function Loader({msg}){return<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"44px 20px",gap:12}}><div style={{width:26,height:26,borderRadius:"50%",border:"2px solid rgba(1,53,90,.45)",borderTopColor:"#17a3a3",animation:"qspin .7s linear infinite"}}/><p style={{fontSize:11.5,color:"#2e5468"}}>{msg}</p></div>;}
function Hook({text}){return<div style={{padding:"10px 12px",background:"rgba(245,166,35,.05)",borderRight:"3px solid #f5a623",borderRadius:"0 7px 7px 0",marginBottom:10}}><p style={{fontSize:13,fontWeight:600,color:"#f5a623",lineHeight:1.6,direction:"rtl",margin:0}}>{text}</p></div>;}
function ErrBox({msg}){if(!msg)return null;return<div style={{padding:"8px 12px",borderRadius:7,background:"rgba(255,100,100,.06)",border:"1px solid rgba(255,100,100,.2)",color:"#f07070",fontSize:11,marginBottom:10}}>{msg}</div>;}
function Hr(){return<hr style={{border:"none",borderTop:"1px solid rgba(1,53,90,.45)",margin:"12px 0"}}/>;}
function Row({label,val}){if(val===undefined||val===null||val==="")return null;return<div style={{marginBottom:7,direction:"rtl",textAlign:"right"}}><p style={{fontSize:9.5,color:"#2e5468",marginBottom:2,textTransform:"uppercase",letterSpacing:".04em"}}>{label}</p><p style={{fontSize:12,color:"#ddeef4",lineHeight:1.6}}>{val}</p></div>;}

const card={background:"#071630",border:"1px solid rgba(1,53,90,.45)",borderRadius:10,overflow:"hidden",marginBottom:10};
const cHead={padding:"11px 14px",borderBottom:"1px solid rgba(1,53,90,.45)",display:"flex",alignItems:"center",justifyContent:"space-between"};
const cBody={padding:14};
const row2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:10};

/* ─── GROUPED PRODUCT PICKER ─── */
const PRODUCT_GROUPS=[
  {key:"core",    ar:"المنتجات الأساسية",  en:"Core Products"},
  {key:"segment", ar:"شرائح العملاء",      en:"Audience"},
  {key:"service", ar:"الخدمات",            en:"Services"},
  {key:"offer",   ar:"العروض الموسمية",    en:"Seasonal Offers"},
];

function GroupedProductPicker({selected,onSelect,lang,extras=[],onToggleExtra=()=>{}}){
  const T=(a,e)=>lang==="ar"?a:e;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {PRODUCT_GROUPS.map(grp=>{
        const items=PRODUCTS.filter(p=>p.g===grp.key);
        const isCore=grp.key==="core";
        return(
          <div key={grp.key}>
            <div style={{fontSize:9,fontWeight:700,color:"#2e5468",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5,direction:"rtl",textAlign:"right"}}>
              {T(grp.ar,grp.en)}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {items.map(p=>{
                const on=isCore?selected===p.v:extras.includes(p.v);
                const label=lang==="ar"?p.ar:p.v;
                return(
                  <button key={p.v} onClick={()=>isCore?onSelect(p.v):onToggleExtra(p.v)} style={{
                    padding:"5px 11px",borderRadius:5,cursor:"pointer",
                    fontFamily:"inherit",fontSize:11,fontWeight:on?700:500,
                    border:`1px solid ${on?p.color+"80":"rgba(1,53,90,.45)"}`,
                    background:on?p.color+"18":"#0a1f3d",
                    color:on?p.color:"#6a96aa",
                    transition:"all .15s",whiteSpace:"nowrap"
                  }}>
                    {label.split("—")[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* compact chip variant used in Brief / LP tabs */
function GroupedProductChips({selected,onSelect,lang,extras=[],onToggleExtra=()=>{}}){
  const T=(a,e)=>lang==="ar"?a:e;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {PRODUCT_GROUPS.map(grp=>{
        const items=PRODUCTS.filter(p=>p.g===grp.key);
        const isCore=grp.key==="core";
        return(
          <div key={grp.key} style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:8.5,fontWeight:700,color:"#2e5468",whiteSpace:"nowrap",direction:"rtl"}}>{T(grp.ar,grp.en)}:</span>
            {items.map(p=>{
              const on=isCore?selected===p.v:extras.includes(p.v);
              const label=lang==="ar"?p.ar.split("—")[0].trim():(p.v.length>12?p.v.slice(0,10)+"…":p.v);
              return(
                <button key={p.v} onClick={()=>isCore?onSelect(p.v):onToggleExtra(p.v)} style={{
                  padding:"3px 9px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",
                  fontSize:10,fontWeight:on?700:400,
                  border:`1px solid ${on?p.color+"70":"rgba(1,53,90,.35)"}`,
                  background:on?p.color+"15":"#0a1f3d",
                  color:on?p.color:"#5a8090",transition:"all .12s",whiteSpace:"nowrap"
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ─── API ─── */
/* CHANGED: now calls our own /api/generate backend instead of Anthropic directly.
   This keeps the API key secret on the server. */
/* Extract the first balanced {...} block from text. Robust to commentary
   before/after the JSON, braces inside strings, and Claude's occasional
   "Here's the JSON: {...}\n\nNote: ..." pattern. */
function extractFirstJsonObject(text){
  let depth=0,start=-1,inStr=false,esc=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(esc){esc=false;continue;}
    if(c==="\\"){esc=true;continue;}
    if(c==='"'){inStr=!inStr;continue;}
    if(inStr)continue;
    if(c==="{"){if(depth===0)start=i;depth++;}
    else if(c==="}"){depth--;if(depth===0&&start!==-1)return text.slice(start,i+1);}
  }
  return null;
}

async function callAI(sys,usr,max_tokens=1400,raw_text=false){
  const res=await fetch("/api/generate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    // json_mode: true forces assistant prefill with "{" on the server,
    // guaranteeing Claude starts the response as a JSON object.
    body:JSON.stringify({system:sys,user:usr,max_tokens,json_mode:!raw_text})
  });
  if(!res.ok){
    const e=await res.json().catch(()=>({}));
    throw new Error(e?.error||`Error ${res.status}`);
  }
  const d=await res.json();
  const text=(d.content||[]).map(b=>b.text||"").join("").trim();
  if(raw_text)return text;
  // With json_mode the response already starts with "{" — clean up just in case
  const clean=text.replace(/```json\n?|\n?```/g,"").trim();
  try{return JSON.parse(clean);}
  catch{
    // Fallback: extract first balanced JSON object
    const block=extractFirstJsonObject(clean);
    if(!block)throw new Error("AI did not return valid JSON");
    try{return JSON.parse(block);}
    catch(e){
      const fi=clean.indexOf("{"),li=clean.lastIndexOf("}");
      if(fi!==-1&&li>fi)return JSON.parse(clean.slice(fi,li+1));
      throw e;
    }
  }
}

/* ─── APP ─── */
export default function CreativeOS(){
  const[lang,setLang]=useState("ar");
  const[tab,setTab]=useState("content");

  const[prod,setProd]=useState("Qoyod Main");
  const[prodExtras,setProdExtras]=useState([]);
  const[funnel,setFunnel]=useState("TOF");
  const[chan,setChan]=useState("Instagram");
  const[fmt,setFmt]=useState("Static");
  const[sector,setSector]=useState("General");
  const[hookType,setHookType]=useState("Fear");
  const[featFocus,setFeatFocus]=useState("");
  const[contentICP,setContentICP]=useState("");
  const[campRef,setCampRef]=useState("");
  const[extraNote,setExtraNote]=useState("");
  const[cr,setCr]=useState(null);
  const[cl,setCl]=useState(false);
  const[ce,setCe]=useState("");
  const[pvRatio,setPvRatio]=useState("1:1");
  const[abMode,setAbMode]=useState(false);
  const[abConceptCt,setAbConceptCt]=useState("");

  const[campType,setCampType]=useState("Seasonal");
  const[campTheme,setCampTheme]=useState("");
  const[campObj,setCampObj]=useState("Leads");
  const[campChs,setCampChs]=useState(["Meta","TikTok","Snapchat"]);
  const[campCtx,setCampCtx]=useState("");
  const[campBudget,setCampBudget]=useState("");
  const[campDuration,setCampDuration]=useState("4");
  const[campScope,setCampScope]=useState("Saudi Arabia");
  const[campRes,setCampRes]=useState(null);
  const[campLd,setCampLd]=useState(false);
  const[campErr,setCampErr]=useState("");

  const[mComp,setMComp]=useState("");
  const[mChan,setMChan]=useState("Instagram");
  const[mDesc,setMDesc]=useState("");
  const[mRes,setMRes]=useState(null);
  const[mLd,setMLd]=useState(false);
  const[mErr,setMErr]=useState("");
  const[ilog,setIlog]=useState([]);

  const[bProd,setBProd]=useState("QFlavours");
  const[bProdExtras,setBProdExtras]=useState([]);
  const[bMsg,setBMsg]=useState("");
  const[bHook,setBHook]=useState("");
  const[bCta,setBCta]=useState("");
  const[bPlaces,setBPlaces]=useState(["1:1","4:5","9:16"]);
  const[bStyle,setBStyle]=useState("device_dashboard");
  const[bTrust,setBTrust]=useState("ZATCA Logo");
  const[bPersona,setBPersona]=useState("");
  const[bSector,setBSector]=useState("");
  const[bRes,setBRes]=useState(null);
  const[bLd,setBLd]=useState(false);
  const[bErr,setBErr]=useState("");
  const[appV,setAppV]=useState(null);
  const[numVariants,setNumVariants]=useState(1);
  const[designPngs,setDesignPngs]=useState({});
  const[designLds,setDesignLds]=useState({});
  const[designErrs,setDesignErrs]=useState({});
  const[designProviders,setDesignProviders]=useState({});
  const[designPrompts,setDesignPrompts]=useState({});
  const[imageProvider,setImageProvider]=useState("nano_banana_2");

  const[lpProd,setLpProd]=useState("QFlavours");
  const[lpCompUrl,setLpCompUrl]=useState("");
  const[lpCompDesc,setLpCompDesc]=useState("");
  const[lpGoal,setLpGoal]=useState("Leads");
  const[lpSector,setLpSector]=useState("Restaurant");
  const[lpRes,setLpRes]=useState(null);
  const[lpLd,setLpLd]=useState(false);
  const[lpErr,setLpErr]=useState("");
  const[lpHtml,setLpHtml]=useState("");
  const[lpHtmlLd,setLpHtmlLd]=useState(false);
  const[lpHtmlErr,setLpHtmlErr]=useState("");
  const[lpCopied,setLpCopied]=useState(false);
  const[lpHtmlB,setLpHtmlB]=useState("");
  const[lpHtmlBLd,setLpHtmlBLd]=useState(false);
  const[lpHtmlBErr,setLpHtmlBErr]=useState("");
  const[lpHtmlBCopied,setLpHtmlBCopied]=useState(false);
  const[wpUrl,setWpUrl]=useState("");
  const[wpUser,setWpUser]=useState("");
  const[wpPass,setWpPass]=useState("");
  const[wpShowSettings,setWpShowSettings]=useState(false);
  const[wpUploadingA,setWpUploadingA]=useState(false);
  const[wpUploadingB,setWpUploadingB]=useState(false);
  const[wpResA,setWpResA]=useState(null);
  const[wpResB,setWpResB]=useState(null);
  const[wpErrA,setWpErrA]=useState("");
  const[wpErrB,setWpErrB]=useState("");
  const[wpConfigured,setWpConfigured]=useState(false);
  const[hsConfigured,setHsConfigured]=useState(false);
  const[hsUploadingA,setHsUploadingA]=useState(false);
  const[hsUploadingB,setHsUploadingB]=useState(false);
  const[hsResA,setHsResA]=useState(null);
  const[hsResB,setHsResB]=useState(null);
  const[hsErrA,setHsErrA]=useState("");
  const[hsErrB,setHsErrB]=useState("");
  const[canvaConn,setCanvaConn]=useState(false);
  const[canvaLd,setCanvaLd]=useState(false);
  const[canvaMsg,setCanvaMsg]=useState({});
  const[miroConn,setMiroConn]=useState(false);
  const[miroLd,setMiroLd]=useState(false);
  const[miroMsg,setMiroMsg]=useState("");
  const[miroErr,setMiroErr]=useState("");
  const[miroBoardId,setMiroBoardId]=useState("");
  const[driveLd,setDriveLd]=useState({});
  const[driveLinks,setDriveLinks]=useState({});
  const[driveErrs,setDriveErrs]=useState({});
  const[syncLd,setSyncLd]=useState(false);
  const[syncResult,setSyncResult]=useState(null);
  const[syncErr,setSyncErr]=useState("");
  /* (Nano-Banana SVG refinement removed with the new design pipeline.) */
  const[lpQuickDlLd,setLpQuickDlLd]=useState(false);
  const[lpQuickWpLd,setLpQuickWpLd]=useState(false);
  const[lpQuickHsLd,setLpQuickHsLd]=useState(false);
  const[lpQuickErr,setLpQuickErr]=useState("");
  const[advContent,setAdvContent]=useState(false);
  const[advLP,setAdvLP]=useState(false);
  const[customPersonas,setCustomPersonas]=useState([]);
  const[newPersona,setNewPersona]=useState({title:"",en:"",icon:"👤",tier:"A",pain_ar:"",hook_ar:"",funnel:"TOF",channels:[]});
  const[showAddPersona,setShowAddPersona]=useState(false);

  /* ── Content Calendar ── */
  const[calProd,setCalProd]=useState("Qoyod Main");
  const[calMonth,setCalMonth]=useState("مايو 2025");
  const[calPlatforms,setCalPlatforms]=useState(["Instagram","TikTok","Snapchat"]);
  const[calFreq,setCalFreq]=useState("3 posts/week");
  const[calGoal,setCalGoal]=useState("Awareness + Leads");
  const[calRes,setCalRes]=useState(null);
  const[calLd,setCalLd]=useState(false);
  const[calErr,setCalErr]=useState("");

  /* ── A/B Variants ── */
  const[abProd,setAbProd]=useState("Qoyod Main");
  const[abConcept,setAbConcept]=useState("");
  const[abChan,setAbChan]=useState("Instagram");
  const[abFmt,setAbFmt]=useState("Static");
  const[abAud,setAbAud]=useState("TOF");
  const[abRes,setAbRes]=useState(null);
  const[abLd,setAbLd]=useState(false);
  const[abErr,setAbErr]=useState("");

  /* ── Email / WhatsApp Sequences ── */
  const[seqProd,setSeqProd]=useState("Qoyod Main");
  const[seqType,setSeqType]=useState("welcome");
  const[seqSteps,setSeqSteps]=useState(3);
  const[seqChannel,setSeqChannel]=useState("email");
  const[seqRes,setSeqRes]=useState(null);
  const[seqLd,setSeqLd]=useState(false);
  const[seqErr,setSeqErr]=useState("");


  /* ── Ad Spec Sheet ── */
  const[specProd,setSpecProd]=useState("Qoyod Main");
  const[specPlatforms,setSpecPlatforms]=useState(["Meta","TikTok","Snapchat","Google"]);
  const[specGoal,setSpecGoal]=useState("Leads");
  const[specRes,setSpecRes]=useState(null);
  const[specLd,setSpecLd]=useState(false);
  const[specErr,setSpecErr]=useState("");

  const T=(ar,en)=>lang==="en"?en:ar;
  const dir=lang==="ar"?"rtl":"ltr";
  const pctx=PRODUCTS.find(p=>p.v===prod)||PRODUCTS[0];

  useEffect(()=>{
    fetch(`/api/wp-config`).then(r=>r.ok?r.json():null).then(d=>{
      if(!d)return;
      if(d.siteUrl)setWpUrl(d.siteUrl);
      if(d.username)setWpUser(d.username);
      if(d.configured)setWpConfigured(true);
    }).catch(()=>{});
    fetch(`/api/hs-config`).then(r=>r.ok?r.json():null).then(d=>{
      if(d?.configured)setHsConfigured(true);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(document.getElementById("qcss"))return;
    const el=document.createElement("style");el.id="qcss";
    el.textContent=`@keyframes qspin{to{transform:rotate(360deg)}}@keyframes qrise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}.qa{animation:qrise .25s ease both}input,textarea,select{width:100%;padding:7px 10px;background:rgba(7,22,48,.7);border:1px solid rgba(1,53,90,.45);border-radius:7px;color:#ddeef4;font-family:inherit;font-size:12.5px;outline:none;transition:border-color .15s;box-sizing:border-box}input:focus,textarea:focus,select:focus{border-color:rgba(23,163,164,.4);box-shadow:0 0 0 2px rgba(23,163,164,.07)}textarea{resize:vertical;line-height:1.6}select option{background:#0a1f3d}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(1,53,90,.45);border-radius:2px}`;
    document.head.appendChild(el);
  },[]);

  const copyText=txt=>navigator.clipboard.writeText(txt).catch(()=>{});

  const buildProdCtx=useCallback((primaryProd,extras,lang2)=>{
    const all=[primaryProd,...extras].filter(Boolean);
    const items=all.map(v=>PRODUCTS.find(p=>p.v===v)).filter(Boolean);
    const desc=items.map(p=>lang2==="en"?p.desc_en:p.desc_ar).join(" | ");
    const names=items.map(p=>lang2==="en"?p.v:(p.ar||p.v).split("—")[0].trim()).join(" + ");
    return{names,desc};
  },[]);

  const toggleExtra=useCallback((v,setExtras)=>{
    const grp=PRODUCTS.find(p=>p.v===v)?.g;
    setExtras(prev=>{
      const filtered=prev.filter(x=>PRODUCTS.find(p=>p.v===x)?.g!==grp);
      return prev.includes(v)?filtered:[...filtered,v];
    });
  },[]);

  const genContent=useCallback(async()=>{
    const ff=FEATURES.find(f=>f.v===featFocus);
    const fctx=ff?(lang==="en"?ff.desc_en:ff.desc_ar):"";
    const icpP=ICP_PERSONAS.find(p=>p.id===contentICP);
    const icpCtx=icpP?`Target ICP: ${icpP.title} — Pain: ${icpP.pain_ar} — Hook angle: ${icpP.hook_ar}`:"";
    const{names:prodNames,desc:prodDesc}=buildProdCtx(prod,prodExtras,lang);
    const ol=lang==="en"?"Write ALL copy in English. Professional, concise.":"Write ALL copy in Saudi dialect ONLY (مو/وش/ليش/يكلفك). NEVER Egyptian (مش/ايه/بتاعك).";
    // Build channel-specific output spec
    let chanSpec="";
    let outFmt="";
    if(chan==="Google Ads"){
      if(lang==="ar"){
        chanSpec="Google Search RSA (Arabic). All headlines and descriptions in Saudi Arabic dialect. STRICT: each headline ≤30 Arabic chars (count carefully). Each description ≤90 Arabic chars. Write exactly 15 headlines and 4 descriptions.";
      }else{
        chanSpec="Google Search RSA (English). All headlines and descriptions in English. STRICT: each headline ≤30 chars (count carefully). Each description ≤90 chars. Write exactly 15 headlines and 4 descriptions.";
      }
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"google_headlines":["h1","h2","h3","h4","h5","h6","h7","h8","h9","h10","h11","h12","h13","h14","h15"],"google_descriptions":["d1","d2","d3","d4"]}`;
    }else if(chan==="LinkedIn"){
      chanSpec=`LinkedIn professional post. No hashtags. 150-250 words. B2B tone. Write in ${lang==="ar"?"Saudi Arabic dialect":"English"}.`;
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"caption":"LinkedIn post 150-250 words, professional tone, no hashtags"}`;
    }else if(chan==="Twitter/X"){
      chanSpec="Twitter/X post. Max 280 chars. Punchy, direct. 2-3 relevant hashtags.";
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"caption":"tweet ≤280 chars with 2-3 hashtags"}`;
    }else if(chan==="TikTok"){
      chanSpec="TikTok video caption + script hook. Conversational, trending format. 3-5 hashtags.";
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"caption":"TikTok caption with hook + 3-5 hashtags"}`;
    }else if(chan==="Snapchat"){
      chanSpec="Snapchat ad caption. Ultra-short, punchy, direct. Max 100 chars visible. Young professional audience.";
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"caption":"Snapchat caption ≤100 chars"}`;
    }else if(chan==="Facebook"){
      chanSpec="Facebook post. Conversational, 80-160 words. 3-4 relevant hashtags. Suitable for Meta feed.";
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"caption":"Facebook post 80-160 words with 3-4 hashtags"}`;
    }else{
      // Instagram default
      chanSpec=`Instagram post caption. Engaging, 80-150 words. 4-5 targeted ${lang==="ar"?"Arabic + English":"relevant"} hashtags. Ready to post.`;
      outFmt=`{"ad_copy":{"hook":"...","body":"...","cta":"..."},"caption":"Instagram caption 80-150 words with 4-5 hashtags"}`;
    }
    const sys=`Senior performance copywriter for Qoyod — Saudi cloud accounting SaaS, ZATCA-accredited.\n${ol}\n${QOYOD_VOICE}\nProduct: ${prodDesc}\n${fctx?"Feature: "+fctx:""}\n${icpCtx?"ICP: "+icpCtx:""}\nChannel: ${chan}. ${chanSpec}\nRule: ONE clear message per output. No emojis. Generate ONLY for ${chan} — do not include other channels.\nReturn ONLY valid JSON (no markdown):\n${outFmt}`;
    const usr=`Products:${prodNames} Channel:${chan} Audience:${funnel} Sector:${sector} Feature:${ff?.ar||"general"} ICP:${icpP?.title||"general"} Note:${extraNote||"none"}`;
    setCl(true);setCe("");setCr(null);
    try{setCr(await callAI(sys,usr,chan==="Google Ads"?1800:1200));}catch(e){setCe(e.message);}finally{setCl(false);}
  },[lang,prod,prodExtras,chan,funnel,sector,featFocus,contentICP,extraNote,buildProdCtx]);

  const genContentAB=useCallback(async()=>{
    if(!abConceptCt.trim()){setCe(T("اكتب الفكرة أو الرسالة لتوليد نسختين","Enter a concept or message to generate A/B variants"));return;}
    const{names:prodNames,desc:prodDesc}=buildProdCtx(prod,prodExtras,lang);
    const icpP=ICP_PERSONAS.find(p=>p.id===contentICP);
    const icpCtx=icpP?`Target ICP: ${icpP.title} — Pain: ${icpP.pain_ar} — Hook: ${icpP.hook_ar}`:"";
    const ol=lang==="en"?"Write all copy in English.":"Write all Arabic copy in Saudi dialect (مو/وش/ليش). NEVER Egyptian.";
    const sys=`Senior CRO copywriter for Qoyod (Saudi cloud accounting SaaS). ${ol}\n${QOYOD_VOICE}\n${icpCtx?"ICP: "+icpCtx:""}\nTwo genuinely different A/B variants — different angle, different hook, different trigger.\nReturn ONLY valid JSON:\n{"variant_a":{"label":"A — [angle name]","ad_copy":{"hook":"...","body":"...","cta":"..."},"google_headlines":["≤30 chars","≤30 chars","≤30 chars"],"captions":{"instagram":"...with hashtags","linkedin":"..."},"predicted_ctr":"high/med/low","why":"..."},"variant_b":{"label":"B — [angle name]","ad_copy":{"hook":"...","body":"...","cta":"..."},"google_headlines":["≤30 chars","≤30 chars","≤30 chars"],"captions":{"instagram":"...with hashtags","linkedin":"..."},"predicted_ctr":"high/med/low","why":"..."},"recommendation":"..."}`;
    const usr=`Products:${prodNames} Desc:${prodDesc} Channel:${chan} Audience:${funnel} Sector:${sector} ICP:${icpP?.title||"general"} Concept:"${abConceptCt}"`;
    setCl(true);setCe("");setCr(null);setAbRes(null);
    try{setAbRes(await callAI(sys,usr,3000));}catch(e){setCe(e.message);}finally{setCl(false);}
  },[lang,prod,prodExtras,chan,funnel,sector,contentICP,abConceptCt,buildProdCtx]);

  const genCampaign=useCallback(async()=>{
    if(!campTheme){setCampErr(T("اكتب موضوع الحملة","Enter a campaign theme"));return;}
    const ol=lang==="en"?"Copy in English.":"Arabic copy in Saudi dialect. Not Egyptian.";
    const budgetCtx=campBudget?`Total budget: ${campBudget} SAR`:"Budget: not specified";
    const adCopiesSchema=campChs.map(c=>`{"channel":"${c}","format":"...","hook":"...","body":"...","cta":"...","trust":"..."}`).join(",");
    const tokenBudget=Math.min(1800+campChs.length*500,7000);
    const sys=`Senior creative director for Qoyod. ${ol}\n${QOYOD_VOICE}\nProduce EXACTLY one ad_copy entry for EACH channel shown in the ad_copies array — no more, no fewer. Return ONLY valid JSON:\n{"campaign_name":"...","core_message":"...","target_stage":"TOF/MOF/BOF","timeline":{"weeks":${campDuration||4},"phases":[{"week":"Week 1-2","focus":"...","action":"..."},{"week":"Week 3-4","focus":"...","action":"..."}]},"hooks":[{"type":"...","text":"...","channel":"...","strength":85},{"type":"...","text":"...","channel":"...","strength":80}],"ad_copies":[${adCopiesSchema}],"budget_split":{${campChs.map(c=>`"${c}":"...%"`).join(",")}},"kpis":["...","...","..."]}`;
    const usr=`Type:${campType} Theme:"${campTheme}" Obj:${campObj} Channels:${campChs.join(",")} Duration:${campDuration} weeks Scope:${campScope} ${budgetCtx} Context:${campCtx||"standard"}`;
    setCampLd(true);setCampErr("");setCampRes(null);
    try{setCampRes(await callAI(sys,usr,tokenBudget));}catch(e){setCampErr(e.message);}finally{setCampLd(false);}
  },[lang,campType,campTheme,campObj,campChs,campCtx,campBudget,campDuration,campScope]);

  const runScan=useCallback(async()=>{
    const ol=lang==="en"?"Counter-creatives in English.":"Counter-creatives in Saudi Arabic dialect.";
    const sys=`Competitor intelligence for Qoyod. ${ol}\n${QOYOD_VOICE}\nReturn ONLY valid JSON:\n{"cards":[{"competitor":"...","platform":"...","hook":"...","message":"...","why_works":"...","weakness":"...","counter":{"hook_ar":"...","body_ar":"...","trust":"...","cta_ar":"...","funnel":"TOF/MOF/BOF"}}]}`;
    setMLd(true);setMErr("");setMRes(null);
    try{setMRes(await callAI(sys,"4 cards: Daftra, Foodics, Rewaa, Wafeq. Each with Qoyod counter-creative."));}
    catch(e){setMErr(e.message);}finally{setMLd(false);}
  },[lang]);

  const genCounter=useCallback(async()=>{
    if(!mDesc){setMErr(T("اصف الإعلان أولاً","Describe the ad first"));return;}
    const ol=lang==="en"?"English":"Saudi Arabic dialect";
    const sys=`Qoyod creative strategist. Counter in ${ol}.\n${QOYOD_VOICE}\nReturn ONLY valid JSON:\n{"cards":[{"competitor":"${mComp||"competitor"}","platform":"${mChan}","hook":"...","message":"...","why_works":"...","weakness":"...","counter":{"hook_ar":"...","body_ar":"...","trust":"...","cta_ar":"...","funnel":"TOF/MOF/BOF"}}]}`;
    setMLd(true);setMErr("");
    try{const r=await callAI(sys,`Comp:${mComp} Ch:${mChan}\nAd:${mDesc}`);setMRes(r);if(r.cards?.[0])setIlog(p=>[{date:new Date().toLocaleDateString(),comp:mComp,ch:mChan,desc:mDesc.slice(0,48)},...p]);}
    catch(e){setMErr(e.message);}finally{setMLd(false);}
  },[lang,mComp,mChan,mDesc]);

  const genBrief=useCallback(async()=>{
    if(!bMsg){setBErr(T("اكتب الرسالة الرئيسية أولاً","Enter the main message first"));return;}
    const{names:bProdNames}=buildProdCtx(bProd,bProdExtras,lang);
    const vList=Array.from({length:numVariants},(_,i)=>`"variant${i+1}":{"concept":"...","art_direction":"...","visual_element":"...","color_accent":"...","layout_note":"..."}`).join(",");
    const sys=`Senior art director for Qoyod.\n${QOYOD_DESIGN}\n${QOYOD_VOICE}\nProduce EXACTLY ${numVariants} distinct design variants.\nReturn ONLY valid JSON:\n{"brief_title":"...",${vList},"shared":{"color_usage":"...","logo_placement":"...","dos":["..."],"donts":["..."]}}`;
    const usr=`Product:${bProdNames} Message:"${bMsg}" Hook:"${bHook||"n/a"}" CTA:"${bCta||"ابدأ تجربتك"}" Placements:${bPlaces.join(",")} Trust:${bTrust} Style:${bStyle} Variants:${numVariants}`;
    setBLd(true);setBErr("");setBRes(null);setAppV(null);setDesignPngs({});setDesignLds({});setDesignErrs({});setDesignProviders({});setDesignPrompts({});
    try{setBRes(await callAI(sys,usr));}catch(e){setBErr(e.message);}finally{setBLd(false);}
  },[lang,bProd,bProdExtras,bMsg,bHook,bCta,bPlaces,bTrust,bStyle,numVariants,buildProdCtx]);

  /* Rotate color scheme per variant so each variant has a clearly different look.
     Bookkeeping product gets its own dark navy + orange scheme automatically (server-side),
     but we also respect it here so the variant rotation feels brand-correct. */
  const isBookkeepingProd = /bookkeeping|مسك|دفاتر/i.test(bProd||"");
  const isFlavoursProd   = /flavour|qflavour|q-flavour|مطعم|فليفرز/i.test(bProd||"");
  const VARIANT_SCHEMES = isBookkeepingProd
    ? ["bookkeeping","bookkeeping","bookkeeping","bookkeeping","bookkeeping","bookkeeping"]
    : isFlavoursProd
    ? ["flavours","flavours","flavours","navy","midnight","flavours"]
    : ["navy","light_cyan","midnight","light_purple","ocean","light_blue"];

  const genDesign=useCallback(async(variantNum,briefOverride)=>{
    const brief=briefOverride||bRes;
    if(!brief)return;
    const data=brief[`variant${variantNum}`]||{};
    const ratio=bPlaces[0]||"1:1";
    const scheme=VARIANT_SCHEMES[(variantNum-1)%VARIANT_SCHEMES.length];
    setDesignLds(p=>({...p,[variantNum]:true}));
    setDesignErrs(p=>({...p,[variantNum]:""}));
    setDesignPngs(p=>({...p,[variantNum]:null}));
    setDesignProviders(p=>({...p,[variantNum]:null}));
    setDesignPrompts(p=>({...p,[variantNum]:null}));
    try{
      const r=await fetch(`/api/generate-design`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          product:bProd,
          message:bMsg,
          hook:bHook,
          cta:bCta||"ابدأ الآن",
          trust:bTrust,
          ratio,
          concept:data.concept||"",
          art_direction:data.art_direction||bStyle,
          color_scheme:scheme,
          variant:variantNum,
          image_provider:imageProvider,
          persona:bPersona,
          sector:bSector,
          visual_style:bStyle,
        }),
      });
      const json=await r.json();
      if(!r.ok||json.error)throw new Error(json.error||"Generation failed");
      setDesignPngs(p=>({...p,[variantNum]:json.png}));
      setDesignProviders(p=>({...p,[variantNum]:json.provider}));
      setDesignPrompts(p=>({...p,[variantNum]:json.image_prompt}));
    }catch(e){
      setDesignErrs(p=>({...p,[variantNum]:e.message}));
    }finally{
      setDesignLds(p=>({...p,[variantNum]:false}));
    }
  },[bRes,bProd,bMsg,bHook,bCta,bTrust,bPlaces,imageProvider,bPersona,bSector]);

  const genDirectDesigns=useCallback(async()=>{
    if(!bMsg){setBErr(T("اكتب الرسالة الرئيسية أولاً","Enter the main message first"));return;}
    const{names:bProdNames}=buildProdCtx(bProd,bProdExtras,lang);
    const vList=Array.from({length:numVariants},(_,i)=>`"variant${i+1}":{"concept":"...","art_direction":"...","visual_element":"...","color_accent":"...","layout_note":"..."}`).join(",");
    const sys=`Senior art director for Qoyod.\n${QOYOD_DESIGN}\n${QOYOD_VOICE}\nProduce EXACTLY ${numVariants} distinct design variants.\nReturn ONLY valid JSON:\n{"brief_title":"...",${vList},"shared":{"color_usage":"...","logo_placement":"..."}}`;
    const usr=`Product:${bProdNames} Message:"${bMsg}" Hook:"${bHook||"n/a"}" CTA:"${bCta||"ابدأ تجربتك"}" Placements:${bPlaces.join(",")} Trust:${bTrust} Style:${bStyle} Variants:${numVariants}`;
    setBLd(true);setBErr("");setBRes(null);setAppV(null);setDesignPngs({});setDesignLds({});setDesignErrs({});setDesignProviders({});setDesignPrompts({});
    try{
      const brief=await callAI(sys,usr);
      setBRes(brief);
      Array.from({length:numVariants},(_,i)=>i+1).forEach(num=>genDesign(num,brief));
    }catch(e){setBErr(e.message);}finally{setBLd(false);}
  },[lang,bProd,bProdExtras,bMsg,bHook,bCta,bPlaces,bTrust,bStyle,numVariants,genDesign,buildProdCtx]);

  /* Convert PNG data URL → Blob for download */
  const dataUrlToBlob=(dataUrl)=>{
    const [header,b64]=dataUrl.split(",");
    const mime=(header.match(/data:([^;]+)/)||[,"image/png"])[1];
    const bin=atob(b64);
    const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    return new Blob([arr],{type:mime});
  };

  /* Re-encode PNG as JPG (for users who want flat backgrounds) */
  const pngToJpgBlob=async(pngDataUrl)=>{
    const img=new Image();
    img.crossOrigin="anonymous";
    await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=pngDataUrl;});
    const canvas=document.createElement("canvas");
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#021544";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
    return new Promise(res=>canvas.toBlob(res,"image/jpeg",0.95));
  };

  const downloadRaster=async(pngDataUrl,variantNum,format)=>{
    try{
      const blob=format==="jpg"||format==="jpeg"
        ?await pngToJpgBlob(pngDataUrl)
        :dataUrlToBlob(pngDataUrl);
      if(!blob)return;
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`qoyod-ad-variant${variantNum}.${format==="jpg"||format==="jpeg"?"jpg":"png"}`;
      document.body.appendChild(a);a.click();
      setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},500);
    }catch(e){console.error("download failed",e);alert("Export failed: "+(e?.message||e));}
  };

  const CANVA_BASE=`/api/canva`;
  const checkCanvaStatus=useCallback(async()=>{
    /* Deep-link mode — always available, no OAuth */
    setCanvaConn(true);
  },[]);
  useEffect(()=>{checkCanvaStatus();},[checkCanvaStatus]);

  /* Open in Canva: stage PNG on server → download locally → open Canva in new tab.
     User drops the file into Canva. No OAuth, no popups, no token state. */
  const openInCanva=useCallback(async(pngDataUrl,variantNum)=>{
    setCanvaLd(true);
    setCanvaMsg(p=>({...p,[variantNum]:{info:T("جاري التحضير...","Preparing...")}}));
    try{
      // 1. Trigger local download so user has the file ready
      const blob=dataUrlToBlob(pngDataUrl);
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=`qoyod-ad-variant${variantNum}.png`;
      document.body.appendChild(a);a.click();
      setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},500);
      // 2. Open Canva editor in a new tab
      window.open("https://www.canva.com/design?create&type=TAYIuREZAEU","_blank","noopener,noreferrer");
      setCanvaMsg(p=>({...p,[variantNum]:{ok:T("تم تنزيل الصورة. اسحبها داخل Canva.","Image downloaded. Drop it into the Canva tab.")}}));
    }catch(e){
      setCanvaMsg(p=>({...p,[variantNum]:{err:e.message}}));
    }finally{setCanvaLd(false);}
  },[lang]);

  const MIRO_BASE="/api/miro";

  useEffect(()=>{
    fetch(`${MIRO_BASE}/status`).then(r=>r.json()).then(d=>setMiroConn(!!d.connected)).catch(()=>{});
  },[]);

  const connectMiro=useCallback(async()=>{
    try{
      const r=await fetch(`${MIRO_BASE}/auth-url`);
      const d=await r.json();
      if(!d.auth_url)throw new Error("Failed to get Miro auth URL");
      const popup=window.open(d.auth_url,"miro_auth","width=560,height=700,noopener");
      const handler=(e)=>{
        if(e.data?.miro_ok){window.removeEventListener("message",handler);popup?.close();setMiroConn(true);setMiroMsg(T("تم ربط Miro بنجاح ✓","Miro connected ✓"));}
        else if(e.data?.miro_error){window.removeEventListener("message",handler);popup?.close();setMiroErr(e.data.miro_error||"Auth failed");}
      };
      window.addEventListener("message",handler);
    }catch(e){setMiroErr(e.message);}
  },[lang]);

  const disconnectMiro=useCallback(async()=>{
    await fetch(`${MIRO_BASE}/logout`,{method:"DELETE"});
    setMiroConn(false);setMiroMsg("");setMiroErr("");setMiroBoardId("");
  },[]);

  const syncProjectToDrive=useCallback(async()=>{
    setSyncLd(true);setSyncResult(null);setSyncErr("");
    try{
      const r=await fetch("/api/drive/sync-project",{method:"POST"});
      const d=await r.json();
      if(!r.ok||d.error)throw new Error(d.error||"Sync failed");
      setSyncResult(d);
    }catch(e){setSyncErr(e.message);}
    finally{setSyncLd(false);}
  },[]);

  const uploadToDrive=useCallback(async(content,filename,mimeType,key)=>{
    setDriveLd(p=>({...p,[key]:true}));
    setDriveErrs(p=>({...p,[key]:""}));
    setDriveLinks(p=>({...p,[key]:""}));
    try{
      const r=await fetch("/api/drive/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content,filename,mimeType})});
      const d=await r.json();
      if(!r.ok||d.error)throw new Error(d.error||"Upload failed");
      setDriveLinks(p=>({...p,[key]:d.link}));
    }catch(e){setDriveErrs(p=>({...p,[key]:e.message}));}
    finally{setDriveLd(p=>({...p,[key]:false}));}
  },[]);

  const createMiroBoard=useCallback(async()=>{
    if(!miroConn){setMiroErr(T("اتصل بـ Miro أولاً","Connect to Miro first"));return;}
    setMiroLd(true);setMiroMsg("");setMiroErr("");
    try{
      const r=await fetch(`${MIRO_BASE}/create-board`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({board_name:"Qoyod Creative OS — Workflow"})});
      const d=await r.json();
      if(!r.ok||d.error)throw new Error(d.error||"Board creation failed");
      setMiroBoardId(d.board_id);
      setMiroMsg(T("✓ تم إنشاء اللوحة — افتح الرابط","✓ Board created — open link"));
      window.open(d.view_link,"_blank");
    }catch(e){setMiroErr(e.message);}
    finally{setMiroLd(false);}
  },[miroConn,lang]);

  /* SVG refinement removed — designs are now AI-generated PNGs.
     To refine, click Retry with a tweaked concept or use the prompt panel below. */

  const genLP=useCallback(async()=>{
    if(!lpCompDesc&&!lpCompUrl){setLpErr(T("اوصف الصفحة أو أدخل رابطاً","Describe the page or enter URL"));return;}
    const ol=lang==="en"?"English":"Saudi Arabic dialect";
    const sys=`Senior conversion-focused web strategist for Qoyod. Analyze competitor landing page, then produce a Qoyod version.\nLanguage: ${ol}\nReturn ONLY valid JSON:\n{"comp_analysis":{"hero_message":"...","key_sections":["..."],"cta_strategy":"...","trust_elements":["..."],"what_works":"...","what_to_improve":"..."},"qoyod_lp":{"page_title":"...","hero":{"headline":"...","subline":"...","cta_primary":"...","cta_secondary":"...","device_shown":"cashier/dashboard/both","trust_badge":"..."},"sections":[{"name":"...","purpose":"...","content":"...","device_mockup":"yes/no","cta":"..."}],"overall_direction":"...","device_mockup_note":"..."}}`;
    const usr=`Competitor URL: ${lpCompUrl||"n/a"}\nDescription: ${lpCompDesc}\nOur product: ${lpProd}\nGoal: ${lpGoal}\nSector: ${lpSector}`;
    setLpLd(true);setLpErr("");setLpRes(null);
    try{setLpRes(await callAI(sys,usr));}catch(e){setLpErr(e.message);}finally{setLpLd(false);}
  },[lang,lpProd,lpCompUrl,lpCompDesc,lpGoal,lpSector]);

  const genLPHtml=useCallback(async()=>{
    if(!lpRes)return;
    const lp=lpRes.qoyod_lp;
    const prodObj=PRODUCTS.find(p=>p.v===lpProd)||PRODUCTS[0];
    const isAr=lang==="ar";
    const dir=isAr?"rtl":"ltr";
    const sys=`You are a senior front-end engineer at a top-tier B2B SaaS company. Your output is ONLY raw HTML — no markdown, no triple backticks, no explanations. The file must be self-contained (all CSS inline in <style>, no JS frameworks, Google Fonts allowed). It must look like a premium, professionally designed landing page — not a template. Standard is: agency-quality, conversion-focused, mobile-responsive.\n\n${QOYOD_VOICE}\n\n${QOYOD_HTML}\n\n${QOYOD_DESIGN}`;
    const usr=`Build a complete landing page for: ${lpProd} — a product by Qoyod (Saudi cloud accounting SaaS, ZATCA-certified).

CONTENT:
- Page title (browser tab): ${lp?.page_title||lpProd}
- Hero headline: ${lp?.hero?.headline}
- Hero subline: ${lp?.hero?.subline}
- Primary CTA button: ${lp?.hero?.cta_primary||(isAr?"ابدأ تجربتك المجانية":"Start Your Free Trial")}
- Secondary CTA button: ${lp?.hero?.cta_secondary||(isAr?"اطلب عرضاً":"Request a Demo")}
- Product description: ${isAr?prodObj.desc_ar:prodObj.desc_en}
- Sections to include: ${JSON.stringify(lp?.sections||[])}
- Strategic direction: ${lp?.overall_direction}

DESIGN SYSTEM — follow EXACTLY:
- Direction: ${dir}
- Language: ${isAr?"Arabic — Saudi dialect ONLY (مو/وش/ليش). Never Egyptian.":"English — professional, direct."}
- Font: Google Fonts — ${isAr?'"IBM Plex Sans Arabic" weights 400,500,600,700':'"Inter" weights 400,500,600,700'}
- Colour tokens:
    --navy: #021544         (primary backgrounds, headings)
    --turq-dark: #01355A    (secondary navy)
    --blue: #13778D         (mid accent)
    --turq: #17A3A4         (primary teal accent, CTAs, highlights)
    --turq-soft: #CFECEC    (light badge backgrounds)
    --turq-50: #EAF6F6      (very light teal for cards)
    --ink: #0B1220          (body text)
    --ink-soft: #2A3345     (secondary text)
    --muted: #6B7280        (captions)
    --line: #E4E8EE         (borders)
    --bg: #FFFFFF
    --bg-soft: #F7FAFB
- Gradient: linear-gradient(225deg, #021544, #01355A)

REQUIRED PAGE STRUCTURE (match the reference HTML design exactly, in this order):
1. Sticky nav — white bg, blur backdrop, Qoyod wordmark "${isAr?"قيود":"Qoyod"}" (navy bold), nav links (${isAr?"المزايا / كيف يعمل / الأسعار / الأسئلة الشائعة":"Features / How it works / Pricing / FAQ"}), primary CTA btn (navy, border-radius 12px)
2. Hero — white bg, radial gradient accents; SPLIT grid (1.05fr / 0.95fr), content ${isAr?"right":"left"}, form ${isAr?"left":"right"}:
   - Content: .eyebrow pill (teal-50 bg + turq border), h1 with accent gradient text on key words, lead paragraph, two CTAs (.btn-primary + outlined), trust list 3 items with ✓ SVG checkmarks: ${isAr?"ZATCA-معتمد / لا يُشترط كارت بنكي / ابدأ في دقيقتين":"ZATCA-certified / No credit card required / Get started in 2 minutes"}
   - Form card: white, border-radius 24px, shadow-pop, 34px padding, ::before pseudo-glow (grad-primary, blur 24px, opacity .18); fields: ${isAr?"الاسم الأول* + الاسم الأخير* (2-col grid), رقم الجوال (phone-wrap: 110px country-code select + phone input) + البريد الإلكتروني* (2-col), المدينة*, اسم الشركة*, نوع النشاط (checkbox-group grid 2×3 with custom CSS checkboxes)":"First Name* + Last Name* (2-col grid), Phone (phone-wrap: 110px country-code select + input) + Email* (2-col), City*, Company Name*, Business Type (checkbox-group grid 2×3 with custom CSS checkboxes)"}, full-width submit btn; TOS footnote
3. Features — .features-bg (bg-soft), 4-col grid; each card: .f-card (border-radius 24px, white bg, 1px line border), .f-icon (52×52 turq-50 bg teal-colored SVG), h3 navy, paragraph ink-soft; hover: translateY(-6px) + shadow-pop + turq-soft border
4. How it works — 3-col grid; .how-card (white, border, radius 24px); .how-num badge (absolute top-right -20px, 48px square, nav gradient, white text); step title + description
5. Pricing — 3-column .price-grid; each .price-card (white, 1.5px line border, radius 24px, flex-col); featured card has turq border + turq-50 gradient bg + .price-badge pill top-right; price amount in 44px font; feature list with ✓ SVG icons; CTA button at bottom
6. Testimonial — centered .testi-card (white, shadow-card, radius 24px, 48px 44px padding); teal quote-mark icon top-right; 19px quote text font-weight 500; avatar circle (grad-primary bg, white initial); name + role
7. FAQ — .faq-wrap (max-width 820px centered); use <details>/<summary> HTML elements styled as accordion; summary: font-weight 600, +/− indicator via ::after; faq-item[open]: turq border + shadow-card
8. CTA band — full-width .cta-box (max-width 1100px, radius 24px, grad-primary bg, 60px 48px padding, decorative ::before/::after shapes); white h2 + p; .btn with white bg + navy text + hover → turq bg white text
9. Footer — var(--navy-deep) bg; 4-col grid (1.5fr 1fr 1fr 1fr); Qoyod wordmark + tagline; footer links; copyright bar with 1px rgba white border-top

CSS RULES:
- Use CSS custom properties (var(--navy) etc.)
- Cards: box-shadow: 0 10px 30px rgba(2,21,68,.08); border-radius: 20px; border: 1px solid var(--line)
- Buttons: border-radius: 12px; font-weight: 600; transition: transform .15s, box-shadow .2s
- Primary button hover: translateY(-2px) + deeper shadow
- Inputs: border: 1.5px solid var(--line); border-radius: 12px; focus: border-color teal + 3px teal glow ring
- Section padding: 80px 24px
- Max content width: 1200px centered with margin:0 auto
- Fully mobile responsive (grid → single column at ≤900px, ≤560px)
- No emojis anywhere — use clean SVG inline icons or pure CSS shapes for feature icons`;
    setLpHtmlLd(true);setLpHtmlErr("");setLpHtml("");
    try{
      const raw=await callAI(sys,usr,4000,true);
      const html=typeof raw==="string"?raw:JSON.stringify(raw,null,2);
      const cleaned=html.replace(/^```html\n?|\n?```$/g,"").trim();
      setLpHtml(cleaned);
    }catch(e){setLpHtmlErr(e.message);}
    finally{setLpHtmlLd(false);}
  },[lang,lpProd,lpRes]);

  /* shared LP HTML builder — returns raw HTML string */
  const _buildLPHtml=useCallback(async(lp)=>{
    const prodObj=PRODUCTS.find(p=>p.v===lpProd)||PRODUCTS[0];
    const isAr=lang==="ar";
    const dir=isAr?"rtl":"ltr";
    const sys=`You are a senior front-end engineer at a top-tier B2B SaaS company. Your output is ONLY raw HTML — no markdown, no triple backticks, no explanations. The file must be self-contained (all CSS inline in <style>, no JS frameworks, Google Fonts allowed). It must look like a premium, professionally designed landing page — not a template. Standard is: agency-quality, conversion-focused, mobile-responsive.\n\n${QOYOD_VOICE}\n\n${QOYOD_HTML}\n\n${QOYOD_DESIGN}`;
    const usr=`Build a complete landing page for: ${lpProd} — a product by Qoyod (Saudi cloud accounting SaaS, ZATCA-certified).\n\nCONTENT:\n- Page title (browser tab): ${lp?.page_title||lpProd}\n- Hero headline: ${lp?.hero?.headline}\n- Hero subline: ${lp?.hero?.subline}\n- Primary CTA button: ${lp?.hero?.cta_primary||(isAr?"ابدأ تجربتك المجانية":"Start Your Free Trial")}\n- Secondary CTA button: ${lp?.hero?.cta_secondary||(isAr?"اطلب عرضاً":"Request a Demo")}\n- Product description: ${isAr?prodObj.desc_ar:prodObj.desc_en}\n- Sections to include: ${JSON.stringify(lp?.sections||[])}\n- Strategic direction: ${lp?.overall_direction}\n\nDIRECTION: ${dir} | LANGUAGE: ${isAr?"Arabic — Saudi dialect ONLY":"English — professional, direct."} | FONT: ${isAr?'"IBM Plex Sans Arabic"':'"Inter"'}\n\n${QOYOD_DESIGN}`;
    const raw=await callAI(sys,usr,4000,true);
    const html=typeof raw==="string"?raw:JSON.stringify(raw,null,2);
    return html.replace(/^```html\n?|\n?```$/g,"").trim();
  },[lang,lpProd]);

  /* one-click: generate HTML A + export to destination */
  const genLPHtmlAndExport=useCallback(async(dest)=>{
    if(!lpRes)return;
    const setLd=dest==="dl"?setLpQuickDlLd:dest==="wp"?setLpQuickWpLd:setLpQuickHsLd;
    setLd(true);setLpQuickErr("");
    try{
      const html=await _buildLPHtml(lpRes.qoyod_lp);
      setLpHtml(html);
      if(dest==="dl"){
        const blob=new Blob([html],{type:"text/html;charset=utf-8"});
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download=`${lpProd.toLowerCase().replace(/\s+/g,"-")}-landing-page.html`;
        a.click();URL.revokeObjectURL(url);
      }else if(dest==="wp"){
        if(!wpConfigured&&(!wpUrl||!wpUser||!wpPass)){setWpShowSettings(true);setLd(false);return;}
        const r=await fetch(`/api/wp-draft`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteUrl:wpUrl,username:wpUser,appPassword:wpPass,content:html,title:`Qoyod Landing Page — ${lpProd}`,slug:`qoyod-lp-${lpProd.toLowerCase().replace(/\s+/g,"-")}`})});
        const json=await r.json();
        if(!r.ok||json.error)throw new Error(json.error||"WordPress upload failed");
        setWpResA(json);
      }else if(dest==="hs"){
        const r=await fetch(`/api/hs-draft`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:html,title:`Qoyod Landing Page — ${lpProd}`,slug:`qoyod-lp-${lpProd.toLowerCase().replace(/\s+/g,"-")}-${Date.now()}`})});
        const json=await r.json();
        if(!r.ok||json.error)throw new Error(json.error||"HubSpot upload failed");
        setHsResA(json);
      }
    }catch(e){setLpQuickErr(e.message);}
    finally{setLd(false);}
  },[lpRes,lpProd,_buildLPHtml,wpConfigured,wpUrl,wpUser,wpPass]);

  const downloadLP=useCallback(()=>{
    if(!lpHtml)return;
    const blob=new Blob([lpHtml],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`${lpProd.toLowerCase().replace(/\s+/g,"-")}-landing-page.html`;
    a.click();URL.revokeObjectURL(url);
  },[lpHtml,lpProd]);

  const copyLP=useCallback(()=>{
    if(!lpHtml)return;
    navigator.clipboard.writeText(lpHtml).then(()=>{setLpCopied(true);setTimeout(()=>setLpCopied(false),2000);});
  },[lpHtml]);

  const genLPHtmlB=useCallback(async()=>{
    if(!lpRes)return;
    const lp=lpRes.qoyod_lp;
    const prodObj=PRODUCTS.find(p=>p.v===lpProd)||PRODUCTS[0];
    const isAr=lang==="ar";
    const dir=isAr?"rtl":"ltr";
    const sys=`You are a senior front-end engineer at a top-tier B2B SaaS company. Your output is ONLY raw HTML — no markdown, no triple backticks, no explanations. The file must be self-contained (all CSS inline in <style>, no JS frameworks, Google Fonts allowed). It must look like a premium, professionally designed landing page — not a template. Standard is: agency-quality, conversion-focused, mobile-responsive.\n\n${QOYOD_VOICE}\n\n${QOYOD_HTML}\n\n${QOYOD_DESIGN}`;
    const usr=`Build a complete landing page VARIANT B (A/B Test) for: ${lpProd} — a product by Qoyod (Saudi cloud accounting SaaS, ZATCA-certified).

THIS IS VARIANT B — use a COMPLETELY DIFFERENT ANGLE than Variant A:
- Variant A angle: value, productivity, time-saving, ease of use
- Variant B angle: TRUST, COMPLIANCE, SECURITY — lead with ZATCA certification, SOCPA, government recognition, data security, expert support team

CONTENT:
- Page title (browser tab): ${lp?.page_title||lpProd} — Variant B
- Hero headline: rewrite with trust/compliance focus (e.g. "معتمد من هيئة الزكاة والضريبة والجمارك — إدارة مالية لا تقبل الأخطاء")
- Hero subline: emphasize compliance, security, and certified expertise
- Primary CTA button: ${lp?.hero?.cta_primary||(isAr?"ابدأ تجربتك المجانية":"Start Your Free Trial")}
- Secondary CTA button: ${lp?.hero?.cta_secondary||(isAr?"اطلب عرضاً":"Request a Demo")}
- Product description: ${isAr?prodObj.desc_ar:prodObj.desc_en}
- Sections to include: ${JSON.stringify(lp?.sections||[])}

DESIGN SYSTEM — follow EXACTLY (same design system as Variant A, different content/angle):
- Direction: ${dir}
- Language: ${isAr?"Arabic — Saudi dialect ONLY (مو/وش/ليش). Never Egyptian.":"English — professional, direct."}
- Font: Google Fonts — ${isAr?'"IBM Plex Sans Arabic" weights 400,500,600,700':'"Inter" weights 400,500,600,700'}
- Colour tokens: --navy: #021544; --turq: #17A3A4; --turq-soft: #CFECEC; --ink: #0B1220; --bg: #FFFFFF; --bg-soft: #F7FAFB; --line: #E4E8EE
- REQUIRED SECTIONS (trust-forward order):
  1. Sticky header (same as Variant A)
  2. Hero — lead with compliance badge (ZATCA Phase 2 certified), bold trust headline, form on side
  3. Certifications bar — ZATCA logo + SOCPA + ISO/data security badges
  4. Social proof — number stats (25,000+ شركة, 99.9% uptime, 24/7 support) in navy cards
  5. Features — compliance-first framing (e-invoice, VAT returns, audit trail, data encryption)
  6. Expert support section — team, response time, dedicated account manager
  7. CTA band
  8. Footer
- Add "Variant B" comment in HTML <!-- A/B TEST: VARIANT B — Trust/Compliance angle -->
- CSS: same card/button/input styles as Variant A
- Fully mobile responsive. No emojis.`;
    setLpHtmlBLd(true);setLpHtmlBErr("");setLpHtmlB("");
    try{
      const raw=await callAI(sys,usr,4000,true);
      const html=typeof raw==="string"?raw:JSON.stringify(raw,null,2);
      setLpHtmlB(html.replace(/^```html\n?|\n?```$/g,"").trim());
    }catch(e){setLpHtmlBErr(e.message);}
    finally{setLpHtmlBLd(false);}
  },[lang,lpProd,lpRes]);

  const downloadLPB=useCallback(()=>{
    if(!lpHtmlB)return;
    const blob=new Blob([lpHtmlB],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`${lpProd.toLowerCase().replace(/\s+/g,"-")}-landing-page-variant-b.html`;
    a.click();URL.revokeObjectURL(url);
  },[lpHtmlB,lpProd]);

  const copyLPB=useCallback(()=>{
    if(!lpHtmlB)return;
    navigator.clipboard.writeText(lpHtmlB).then(()=>{setLpHtmlBCopied(true);setTimeout(()=>setLpHtmlBCopied(false),2000);});
  },[lpHtmlB]);

  const uploadToWP=useCallback(async(html,variant)=>{
    if(!wpConfigured&&(!wpUrl||!wpUser||!wpPass)){setWpShowSettings(true);return;}
    const setUpl=variant==="B"?setWpUploadingB:setWpUploadingA;
    const setRes=variant==="B"?setWpResB:setWpResA;
    const setErr=variant==="B"?setWpErrB:setWpErrA;
    setUpl(true);setRes(null);setErr("");
    try{
      const r=await fetch(`/api/wp-draft`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          siteUrl:wpUrl,username:wpUser,appPassword:wpPass,
          content:html,
          title:`Qoyod Landing Page — Variant ${variant}`,
          slug:`qoyod-lp-variant-${variant.toLowerCase()}`,
        }),
      });
      const json=await r.json();
      if(!r.ok||json.error)throw new Error(json.error||"Upload failed");
      setRes(json);
    }catch(e){setErr(e.message);}finally{setUpl(false);}
  },[wpUrl,wpUser,wpPass]);

  const uploadToHS=useCallback(async(html,variant)=>{
    const setUpl=variant==="B"?setHsUploadingB:setHsUploadingA;
    const setRes=variant==="B"?setHsResB:setHsResA;
    const setErr=variant==="B"?setHsErrB:setHsErrA;
    setUpl(true);setRes(null);setErr("");
    try{
      const r=await fetch(`/api/hs-draft`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          content:html,
          title:`Qoyod Landing Page — Variant ${variant}`,
          slug:`qoyod-lp-variant-${variant.toLowerCase()}-${Date.now()}`,
        }),
      });
      const json=await r.json();
      if(!r.ok||json.error)throw new Error(json.error||"Upload failed");
      setRes(json);
    }catch(e){setErr(e.message);}finally{setUpl(false);}
  },[]);

  const genAllDesigns=useCallback(async()=>{
    for(let i=1;i<=numVariants;i++){await genDesign(i);}
  },[numVariants,genDesign]);


  /* ── Content Calendar ── */
  const genCalendar=useCallback(async()=>{
    const px=PRODUCTS.find(p=>p.v===calProd)||PRODUCTS[0];
    const ol=lang==="en"?"All captions in English.":"All captions in Saudi Arabic dialect (مو/وش/ليش). NEVER Egyptian.";
    const refCopy=`Reference captions from real Qoyod campaigns:\n- "سهل إدارة أعمالك بنظام فواتير ذكي وأصدر فواتيرك الإلكترونية من جوالك مع قيود"\n- "ركّز على نمو مشروعك واترك تعقيد الحسابات علينا — SOCPA certified"\n- "آلاف التجار دخلوا المرحلة الثانية للفوترة الإلكترونية مع قيود، أنت جاهز؟"\n- "لاتدير مصاريفك يدويًا واستخدم قيود — كل التزاماتك الضريبية أسهل"\nUse these as tone/style benchmark.`;
    const sys=`You are a social media content strategist for Qoyod (Saudi cloud accounting SaaS, ZATCA-certified). ${ol}\n${QOYOD_VOICE}\n${refCopy}\nReturn ONLY valid JSON:\n{"month":"...","goal":"...","total_posts":${calFreq==="daily"?30:calFreq==="5 posts/week"?20:calFreq==="3 posts/week"?12:8},"weeks":[{"week":1,"posts":[{"day":"...","platform":"...","format":"Static/Reel/Story/Carousel","topic":"...","design_text":"...","caption":"...","hashtags":"...","cta":"...","funnel_stage":"TOF/MOF/BOF"}]}],"themes":["..."],"hashtag_sets":{"main":"...","secondary":"..."}}`;
    const usr=`Product:${calProd} Desc:${lang==="en"?px.desc_en:px.desc_ar} Month:${calMonth} Platforms:${calPlatforms.join(",")} Frequency:${calFreq} Goal:${calGoal}`;
    setCalLd(true);setCalErr("");setCalRes(null);
    try{setCalRes(await callAI(sys,usr,5000));}catch(e){setCalErr(e.message);}finally{setCalLd(false);}
  },[lang,calProd,calMonth,calPlatforms,calFreq,calGoal]);

  /* ── A/B Variants ── */
  const genAB=useCallback(async()=>{
    if(!abConcept){setAbErr(T("اكتب الفكرة أو الرسالة أولاً","Enter a concept or message first"));return;}
    const px=PRODUCTS.find(p=>p.v===abProd)||PRODUCTS[0];
    const ol=lang==="en"?"Write all copy in English.":"Write all Arabic copy in Saudi dialect (مو/وش/ليش). NEVER Egyptian.";
    const sys=`Senior CRO copywriter for Qoyod (Saudi cloud accounting SaaS). ${ol}\n${QOYOD_VOICE}\nProduce two genuinely different A/B variants — different angle, different hook type, different emotional trigger. Both target the same audience and product.\nReturn ONLY valid JSON:\n{"concept_summary":"...","variant_a":{"label":"A — [angle name]","hook":"...","headline":"...","body":"...","cta":"...","trust":"...","hook_type":"...","emotional_trigger":"...","predicted_ctr":"high/med/low","why":"..."},"variant_b":{"label":"B — [angle name]","hook":"...","headline":"...","body":"...","cta":"...","trust":"...","hook_type":"...","emotional_trigger":"...","predicted_ctr":"high/med/low","why":"..."},"recommendation":"which to test first and why","testing_note":"what metric to optimise"}`;
    const usr=`Product:${abProd} Desc:${lang==="en"?px.desc_en:px.desc_ar} Channel:${abChan} Format:${abFmt} Audience:${abAud} Concept:"${abConcept}"`;
    setAbLd(true);setAbErr("");setAbRes(null);
    try{setAbRes(await callAI(sys,usr,2500));}catch(e){setAbErr(e.message);}finally{setAbLd(false);}
  },[lang,abProd,abConcept,abChan,abFmt,abAud]);

  /* ── Email / WhatsApp Sequences ── */
  const genSeq=useCallback(async()=>{
    const px=PRODUCTS.find(p=>p.v===seqProd)||PRODUCTS[0];
    const ol=lang==="en"?"Write all copy in English.":"Write all Arabic copy in Saudi dialect. NEVER Egyptian.";
    const typeLabel={"welcome":"Welcome series (new trial/subscriber)","nurture":"Nurture series (warm leads, not converted)","winback":"Win-back series (churned/lapsed users)","demo":"Post-demo follow-up sequence","announcement":"Feature announcement / product update"}[seqType]||seqType;
    const channelNote=seqChannel==="whatsapp"?"Messages must be short (max 3 lines each), conversational, no bullet lists, include one link placeholder [LINK].":seqChannel==="sms"?"SMS: max 160 chars per message, ultra-brief.":"Email: subject line + preview text + body (3-6 sentences) + CTA button label.";
    const sys=`You are a B2B lifecycle marketing specialist for Qoyod (Saudi cloud accounting SaaS). ${ol}\n${QOYOD_VOICE}\n${channelNote}\nSequence type: ${typeLabel}\nReturn ONLY valid JSON:\n{"sequence_name":"...","channel":"${seqChannel}","type":"${seqType}","messages":[{"step":1,"send_timing":"immediately / Day N","subject":"...","preview_text":"...","body":"...","cta":"...","goal":"...","tone":"..."}]}`;
    const usr=`Product:${seqProd} Desc:${lang==="en"?px.desc_en:px.desc_ar} Steps:${seqSteps} Channel:${seqChannel} Type:${seqType}`;
    setSeqLd(true);setSeqErr("");setSeqRes(null);
    try{setSeqRes(await callAI(sys,usr,3500));}catch(e){setSeqErr(e.message);}finally{setSeqLd(false);}
  },[lang,seqProd,seqType,seqSteps,seqChannel]);


  /* ── Ad Spec Sheet ── */
  const genSpec=useCallback(async()=>{
    const px=PRODUCTS.find(p=>p.v===specProd)||PRODUCTS[0];
    const ol=lang==="en"?"Respond in English.":"Respond in Arabic with English tech terms where standard.";
    const sys=`You are a performance creative strategist for Qoyod (Saudi cloud accounting SaaS). ${ol}\n${QOYOD_DESIGN}\nGenerate a complete ad creative spec sheet for the selected platforms and product. The "creative_direction" and "dos/donts" must enforce the brand system above (palette, gradient angle, layout grid, sub-product color, mobile readability).\nReturn ONLY valid JSON:\n{"product":"...","goal":"...","platforms":[{"platform":"...","formats":[{"format":"...","dimensions":"...","aspect_ratio":"...","max_file_size":"...","duration":"...","text_limit":"...","headline_chars":"...","body_chars":"...","safe_zone":"...","creative_direction":"...","dos":["..."],"donts":["..."]}]}],"brand_quick_ref":{"primary_color":"#021544","accent_color":"#17A3A4","font":"IBM Plex Sans Arabic / Lama Sans","logo_placement":"...","tone":"..."},"global_dos":["..."],"global_donts":["..."]}`;
    const usr=`Product:${specProd} Desc:${lang==="en"?px.desc_en:px.desc_ar} Platforms:${specPlatforms.join(",")} Goal:${specGoal}`;
    setSpecLd(true);setSpecErr("");setSpecRes(null);
    try{setSpecRes(await callAI(sys,usr,3500));}catch(e){setSpecErr(e.message);}finally{setSpecLd(false);}
  },[lang,specProd,specPlatforms,specGoal]);

  const genSpecFromBrief=useCallback(async()=>{
    const px=PRODUCTS.find(p=>p.v===bProd)||PRODUCTS[0];
    const ol=lang==="en"?"Respond in English.":"Respond in Arabic with English tech terms where standard.";
    const sys=`You are a performance creative strategist for Qoyod (Saudi cloud accounting SaaS). ${ol}\n${QOYOD_DESIGN}\nGenerate a complete ad creative spec sheet for the selected platforms and product. The "creative_direction" and "dos/donts" must enforce the brand system above (palette, gradient angle, layout grid, sub-product color, mobile readability).\nReturn ONLY valid JSON:\n{"product":"...","goal":"...","platforms":[{"platform":"...","formats":[{"format":"...","dimensions":"...","aspect_ratio":"...","max_file_size":"...","duration":"...","text_limit":"...","headline_chars":"...","body_chars":"...","safe_zone":"...","creative_direction":"...","dos":["..."],"donts":["..."]}]}],"brand_quick_ref":{"primary_color":"#021544","accent_color":"#17A3A4","font":"IBM Plex Sans Arabic / Lama Sans","logo_placement":"...","tone":"..."},"global_dos":["..."],"global_donts":["..."]}`;
    const briefPlatforms=bPlaces.length?bPlaces.map(r=>r==="1:1"?"Meta":r==="4:5"?"Instagram":r==="9:16"?"Snapchat":r==="16:9"?"YouTube":r):["Meta","Instagram","Snapchat"];
    const usr=`Product:${bProd} Desc:${lang==="en"?px.desc_en:px.desc_ar} Platforms:${briefPlatforms.join(",")} Goal:Awareness`;
    setSpecLd(true);setSpecErr("");setSpecRes(null);
    try{setSpecRes(await callAI(sys,usr,3500));}catch(e){setSpecErr(e.message);}finally{setSpecLd(false);}
  },[lang,bProd,bPlaces]);

  const TABS=[
    ["content", T("إنشاء محتوى","Content")],
    ["campaign",T("حملة","Campaign")],
    ["calendar",T("خطة المحتوى","Calendar")],
    ["email",   T("رسائل / بريد","Email & WA")],
    ["market",  T("مراقبة السوق","Market Watch")],
    ["brief",   T("التصميم","Design")],
    ["landing", T("صفحات الوصول","Landing Pages")],
    ["library", T("مكتبة الإعلانات","Ad Library")],
    ["icp",     T("شرائح العملاء","ICP")],
  ];

  const SH=({title,sub})=><div style={{marginBottom:15,paddingBottom:11,borderBottom:"1px solid rgba(1,53,90,.45)"}}><h2 style={{fontSize:13.5,fontWeight:700,marginBottom:2}}>{title}</h2><p style={{fontSize:11,color:"#2e5468"}}>{sub}</p></div>;

  return(
    <div style={{background:"#020c1e",color:"#ddeef4",fontFamily:"'Segoe UI',Helvetica,sans-serif",minHeight:"100vh",direction:dir}}>
      <div style={{position:"fixed",width:460,height:460,borderRadius:"50%",background:"rgba(2,21,68,.5)",top:-140,right:-70,filter:"blur(88px)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",width:260,height:260,borderRadius:"50%",background:"rgba(23,163,164,.05)",bottom:0,left:-45,filter:"blur(75px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"sticky",top:0,zIndex:100,height:52,padding:"0 18px",borderBottom:"1px solid rgba(1,53,90,.45)",background:"rgba(2,12,30,.96)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#17a3a3,#13778d)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>Q</div>
          <div>
            <div style={{fontSize:12.5,fontWeight:700}}>Somaa Content Agent</div>
            <div style={{fontSize:9.5,color:"#2e5468",marginTop:1}}>{T("وكيل المحتوى الذكي","AI Content Agent")}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",background:"#0a1f3d",border:"1px solid rgba(1,53,90,.45)",borderRadius:6,overflow:"hidden",height:26}}>
            {["ar","en"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"0 10px",height:"100%",background:lang===l?"rgba(23,163,164,.1)":"none",border:"none",color:lang===l?"#17a3a3":"#2e5468",fontSize:10.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{l.toUpperCase()}</button>)}
          </div>
          <button onClick={syncProjectToDrive} disabled={syncLd} title={T("مزامنة ملفات المشروع إلى Google Drive","Sync project files to Google Drive")} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:5,border:"1px solid rgba(66,133,244,.35)",background:syncResult?"rgba(66,133,244,.12)":"transparent",color:syncResult?"#5dc87a":"#4285f4",fontSize:9.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:syncLd?.6:1}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2v6m0 0l3-3m-3 3L9 5"/><path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z" strokeDasharray="4 2"/><path d="M8 17H5a2 2 0 01-2-2v-3"/><path d="M16 17h3a2 2 0 002-2v-3"/></svg>
            {syncLd?T("يزامن...","Syncing…"):syncResult?`✓ ${syncResult.synced?.length} ${T("ملف","files")}`:T("مزامنة Drive","Sync Drive")}
          </button>
          {syncErr&&<span style={{fontSize:9,color:"#f07070",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={syncErr}>⚠ {syncErr}</span>}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:4,border:"1px solid rgba(23,163,164,.12)",fontSize:9.5,color:"#2e5468"}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:"#17a3a3"}}/>LIVE
          </div>
        </div>
      </div>
      {syncResult&&<div style={{background:"rgba(66,133,244,.08)",borderBottom:"1px solid rgba(66,133,244,.2)",padding:"5px 18px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:9.5,color:"#4285f4",fontWeight:600}}>☁ Drive {T("مزامنة ناجحة","Sync Complete")}:</span>
        {syncResult.synced?.map((f,i)=><span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:f.action==="updated"?"rgba(23,163,164,.12)":"rgba(93,200,122,.12)",color:f.action==="updated"?"#17a3a3":"#5dc87a",border:`1px solid ${f.action==="updated"?"rgba(23,163,164,.3)":"rgba(93,200,122,.3)"}`}}>{f.action==="updated"?"↻":"+"} {f.name}</span>)}
        {syncResult.errors?.length>0&&syncResult.errors.map((e,i)=><span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:"rgba(240,112,112,.1)",color:"#f07070",border:"1px solid rgba(240,112,112,.3)"}}>✗ {e.name}</span>)}
        <a href={syncResult.folderLink} target="_blank" rel="noreferrer" style={{fontSize:9.5,color:"#4285f4",textDecoration:"underline",marginRight:"auto"}}>↗ {T("افتح المجلد","Open Folder")}</a>
        <button onClick={()=>setSyncResult(null)} style={{fontSize:9,color:"#2e5468",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
      </div>}

      <div style={{position:"sticky",top:52,zIndex:99,display:"flex",padding:"0 18px",borderBottom:"1px solid rgba(1,53,90,.45)",background:"rgba(2,12,30,.92)",backdropFilter:"blur(10px)",overflowX:"auto"}}>
        {TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"0 14px",height:42,fontSize:11.5,fontFamily:"inherit",fontWeight:tab===k?600:500,color:tab===k?"#17a3a3":"#2e5468",background:"none",border:"none",borderBottom:`2px solid ${tab===k?"#17a3a3":"transparent"}`,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>{l}</button>)}
      </div>

      <div style={{maxWidth:840,margin:"0 auto",padding:"20px 16px 60px"}}>

        {tab==="content"&&(
          <div className="qa">
            <SH title={T("إنشاء المحتوى الإعلاني","Ad Content Generator")} sub={T("نص + UGC + معاينة بصرية","Copy + UGC + visual preview")}/>
            <ErrBox msg={ce}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("إعدادات الإعلان","Ad Settings")}</span></div>
              <div style={cBody}>
                <Fld label={T("المنتج / الخدمة / العرض","Product / Service / Offer")}>
                  <GroupedProductPicker selected={prod} onSelect={setProd} lang={lang} extras={prodExtras} onToggleExtra={v=>toggleExtra(v,setProdExtras)}/>
                </Fld>
                <Fld label={T("مستوى الجمهور","Audience Level")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    <Seg ch="TOF" on={funnel==="TOF"} gold={funnel==="TOF"} onClick={()=>setFunnel("TOF")}/>
                    <Seg ch="MOF" on={funnel==="MOF"} onClick={()=>setFunnel("MOF")}/>
                    <Seg ch="BOF" on={funnel==="BOF"} onClick={()=>setFunnel("BOF")}/>
                  </div>
                </Fld>
                <Fld label={T("القناة","Channel")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {["Instagram","Facebook","TikTok","Snapchat","LinkedIn","Twitter/X","Google Ads"].map(v=><Seg key={v} ch={v} on={chan===v} onClick={()=>setChan(v)}/>)}
                  </div>
                </Fld>
                <button onClick={()=>setAdvContent(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:"#2e5468",fontSize:10.5,cursor:"pointer",padding:"4px 0",fontFamily:"inherit"}}>
                  <span style={{fontSize:10,transition:"transform .15s",display:"inline-block",transform:advContent?"rotate(90deg)":"none"}}>▶</span>
                  {advContent?T("إخفاء الخيارات المتقدمة","Hide advanced options"):T("خيارات متقدمة","Advanced options")}
                </button>
                {advContent&&(
                  <>
                    <Fld label={T("تركيز الميزة","Feature Focus")}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        <Seg ch={T("بدون","None")} on={featFocus===""} onClick={()=>setFeatFocus("")}/>
                        {FEATURES.map(f=><Seg key={f.v} ch={lang==="ar"?f.ar:f.v} on={featFocus===f.v} onClick={()=>setFeatFocus(f.v)}/>)}
                      </div>
                    </Fld>
                    <Fld label={T("شريحة العميل (ICP)","Target ICP")}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        <Seg ch={T("عام","Any")} on={contentICP===""} onClick={()=>setContentICP("")}/>
                        {ICP_PERSONAS.map(p=><Seg key={p.id} ch={`${p.icon} ${p.title}`} on={contentICP===p.id} onClick={()=>setContentICP(p.id)}/>)}
                      </div>
                    </Fld>
                    <div style={row2}>
                      <Fld label={T("التنسيق","Format")}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{["Static","Video","Carousel","UGC","Reel"].map(v=><Seg key={v} ch={v} on={fmt===v} onClick={()=>setFmt(v)}/>)}</div></Fld>
                      <Fld label={T("القطاع","Sector")}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{SECTORS.map(sc=><Seg key={sc.v} ch={lang==="ar"?sc.ar:sc.en} on={sector===sc.v} onClick={()=>setSector(sc.v)}/>)}</div></Fld>
                    </div>
                    <div style={row2}>
                      <Fld label={T("نوع الجملة الافتتاحية","Hook Type")}><select value={hookType} onChange={e=>setHookType(e.target.value)}>{HOOK_TYPES.map(h=><option key={h.v} value={h.v}>{lang==="ar"?h.ar:h.en}</option>)}</select></Fld>
                      <Fld label={T("مرجع الحملة","Campaign Ref")}><select value={campRef} onChange={e=>setCampRef(e.target.value)}><option value="">{T("— لا يوجد —","— None —")}</option><optgroup label="ZATCA"><option value="C05">C05</option><option value="C07">C07</option></optgroup><optgroup label="F&B"><option value="FL01">FL01</option><option value="FL02">FL02</option></optgroup><optgroup label="Bookkeeping"><option value="C01">C01</option><option value="BK01">BK01</option></optgroup></select></Fld>
                    </div>
                    <Fld label={T("ملاحظة إضافية","Extra Note")}><input value={extraNote} onChange={e=>setExtraNote(e.target.value)} placeholder={T("مثال: الجمهور هو أصحاب المطاعم","e.g. audience is restaurant owners")}/></Fld>
                  </>
                )}
                <div style={{padding:"10px 0",borderTop:"1px solid rgba(1,53,90,.25)",marginTop:4}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:abMode?8:0}}>
                    <span style={{fontSize:11,color:"#6a96aa"}}>{T("عدد النسخ","Output")}</span>
                    <div style={{display:"flex",background:"#0a1f3d",border:"1px solid rgba(1,53,90,.45)",borderRadius:5,overflow:"hidden",height:26}}>
                      {[[false,T("نسخة واحدة","Single")],[true,T("نسختان A/B","A/B")]].map(([v,l])=>(
                        <button key={String(v)} onClick={()=>{setAbMode(v);setCr(null);setAbRes(null);}} style={{padding:"0 11px",height:"100%",background:abMode===v?"rgba(23,163,164,.15)":"none",border:"none",color:abMode===v?"#17a3a3":"#2e5468",fontSize:10.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {abMode&&(
                    <textarea value={abConceptCt} onChange={e=>setAbConceptCt(e.target.value)} rows={2} dir="rtl" style={{textAlign:"right",marginTop:6}} placeholder={T("الفكرة أو الرسالة الرئيسية للنسختين…","Core concept or message for the two variants…")}/>
                  )}
                </div>
                <Btn ch={cl?T("يكتب...","Writing..."):abMode?T("ولّد نسختين A/B","Generate A/B Variants"):T("أنشئ المحتوى الآن","Create Content Now")} gold={!cl} onClick={abMode?genContentAB:genContent} dis={cl} full/>
              </div>
            </div>
            {cl&&<Loader msg={abMode?T("يكتب نسختين بزاوية مختلفة...","Writing two different angles..."):T("يكتب النص الإعلاني...","Writing ad copy...")}/>}
            {abRes&&!cl&&(
              <div className="qa">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                  {["variant_a","variant_b"].map(key=>{
                    const v=abRes[key];if(!v)return null;
                    const isA=key==="variant_a";
                    const accent=isA?"#17a3a3":"#f59e0b";
                    const fullCopy=`${v.ad_copy?.hook}\n\n${v.ad_copy?.body}\n\nCTA: ${v.ad_copy?.cta}\n\nGoogle Headlines:\n${(v.google_headlines||[]).join("\n")}\n\nInstagram:\n${v.captions?.instagram}`;
                    return(
                      <div key={key} style={{...card,marginBottom:0,border:`1.5px solid ${accent}30`}}>
                        <div style={{...cHead,background:`${accent}08`,borderBottom:`1px solid ${accent}20`}}>
                          <span style={{fontSize:11.5,fontWeight:700,color:accent}}>{v.label||key}</span>
                          <div style={{display:"flex",gap:5}}>
                            <Tag ch={v.predicted_ctr||"—"} style={{fontSize:9,background:`${accent}15`,color:accent}}/>
                            <Btn ch={T("نسخ الكل","Copy All")} xs onClick={()=>copyText(fullCopy)}/>
                          </div>
                        </div>
                        <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{padding:"8px 10px",background:"rgba(23,163,164,.05)",borderRadius:6,direction:"rtl"}}>
                            <p style={{fontSize:8.5,color:"#6a96aa",marginBottom:3,textTransform:"uppercase"}}>{T("نسخة الإعلان","Ad Copy")}</p>
                            <p style={{fontSize:12.5,fontWeight:700,marginBottom:5}}>{v.ad_copy?.hook}</p>
                            <p style={{fontSize:11.5,lineHeight:1.7,color:"#bbd4e0"}}>{v.ad_copy?.body}</p>
                            <Tag ch={v.ad_copy?.cta} style={{marginTop:6,fontSize:10,background:`${accent}18`,color:accent}}/>
                          </div>
                          <div>
                            <p style={{fontSize:8.5,color:"#6a96aa",marginBottom:4,textTransform:"uppercase"}}>Google Headlines</p>
                            <div style={{display:"flex",flexDirection:"column",gap:3}}>
                              {(v.google_headlines||[]).map((h,i)=><p key={i} style={{fontSize:11,color:"#ddeef4",padding:"4px 8px",background:"rgba(7,22,48,.8)",borderRadius:4,direction:"ltr",textAlign:"left"}}>{h}</p>)}
                            </div>
                          </div>
                          <div>
                            <p style={{fontSize:8.5,color:"#6a96aa",marginBottom:4,textTransform:"uppercase"}}>{T("كابشن","Caption")}</p>
                            <p style={{fontSize:10.5,color:"#bbd4e0",direction:"rtl",lineHeight:1.6}}>{v.captions?.instagram}</p>
                          </div>
                          <p style={{fontSize:10,color:"#5dc87a",direction:"rtl",borderTop:"1px solid rgba(1,53,90,.3)",paddingTop:6}}>{v.why}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {abRes.recommendation&&(
                  <div style={{...card,marginTop:8}}>
                    <div style={cBody}><p style={{fontSize:9.5,color:"#2e5468",marginBottom:3}}>{T("التوصية","Recommendation")}</p><p style={{fontSize:12,direction:"rtl",lineHeight:1.7,color:"#ddeef4"}}>{abRes.recommendation}</p></div>
                  </div>
                )}
              </div>
            )}
            {cr&&!cl&&!abMode&&(
              <div className="qa">
                <div style={card}>
                  <div style={cHead}>
                    <span style={{fontSize:11.5,fontWeight:600,color:pctx.color}}>{lang==="ar"?pctx.ar:pctx.v} · {chan} · {funnel}</span>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <Btn ch={T("نسخ الكل","Copy All")} xs onClick={()=>{
                        const base=`${cr.ad_copy?.hook}\n\n${cr.ad_copy?.body}\n\nCTA: ${cr.ad_copy?.cta}`;
                        if(chan==="Google Ads")copyText(`${base}\n\nGoogle Headlines:\n${(cr.google_headlines||[]).map((h,i)=>`H${i+1}: ${h}`).join("\n")}\n\nDescriptions:\n${(cr.google_descriptions||[]).map((d,i)=>`D${i+1}: ${d}`).join("\n")}`);
                        else copyText(`${base}\n\n${chan} Caption:\n${cr.caption||""}`);
                      }}/>
                      <button onClick={()=>{
                        const base=`${cr.ad_copy?.hook}\n\n${cr.ad_copy?.body}\n\nCTA: ${cr.ad_copy?.cta}`;
                        const full=chan==="Google Ads"?`${base}\n\nGoogle Headlines:\n${(cr.google_headlines||[]).map((h,i)=>`H${i+1}: ${h}`).join("\n")}\n\nDescriptions:\n${(cr.google_descriptions||[]).map((d,i)=>`D${i+1}: ${d}`).join("\n")}`:`${base}\n\n${chan} Caption:\n${cr.caption||""}`;
                        uploadToDrive(full,"qoyod-ad-copy.txt","text/plain","cr");
                      }} disabled={driveLd["cr"]} style={{padding:"3px 8px",borderRadius:4,border:"1px solid rgba(66,133,244,.4)",background:"rgba(66,133,244,.1)",color:driveLinks["cr"]?"#5dc87a":"#4285f4",fontSize:9.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:driveLd["cr"]?.6:1}}>
                        {driveLd["cr"]?"↑…":driveLinks["cr"]?<a href={driveLinks["cr"]} target="_blank" rel="noreferrer" style={{color:"#5dc87a",textDecoration:"none"}}>✓ Drive</a>:"☁ Drive"}
                      </button>
                    </div>
                  </div>
                  <div style={cBody}>
                    {/* Ad Copy block — always shown */}
                    <div style={{marginBottom:12}}>
                      <p style={{fontSize:8.5,color:"#6a96aa",marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"}}>{T("نسخة الإعلان","Ad Copy")}</p>
                      <div style={{padding:"10px 12px",background:"rgba(23,163,164,.05)",borderRadius:8,direction:"rtl"}}>
                        <p style={{fontSize:14,fontWeight:700,marginBottom:8,lineHeight:1.5}}>{cr.ad_copy?.hook}</p>
                        <p style={{fontSize:12.5,lineHeight:1.8,color:"#bbd4e0",marginBottom:8}}>{cr.ad_copy?.body}</p>
                        <Tag ch={cr.ad_copy?.cta} green style={{fontSize:11}}/>
                      </div>
                    </div>
                    {/* Google Ads — only when Google Ads channel is selected */}
                    {chan==="Google Ads"&&(
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <p style={{fontSize:8.5,color:"#6a96aa",textTransform:"uppercase",letterSpacing:".04em"}}>Google RSA — Headlines ({cr.google_headlines?.length||0}/15)</p>
                          <Btn ch={T("نسخ","Copy")} xs onClick={()=>copyText([...(cr.google_headlines||[]).map((h,i)=>`H${i+1}: ${h}`),...(cr.google_descriptions||[]).map((d,i)=>`D${i+1}: ${d}`)].join("\n"))}/>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:8}}>
                          {(cr.google_headlines||[]).map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:8.5,color:"#17a3a3",fontWeight:700,minWidth:22}}>H{i+1}</span><p style={{fontSize:11.5,color:"#ddeef4",direction:"ltr",textAlign:"left",flex:1}}>{h}</p><span style={{fontSize:8,color:h.length>30?"#f07070":"#2e5468"}}>{h.length}/30</span></div>)}
                        </div>
                        <p style={{fontSize:8.5,color:"#6a96aa",marginBottom:4,textTransform:"uppercase"}}>Descriptions ({cr.google_descriptions?.length||0}/4)</p>
                        <div style={{display:"flex",flexDirection:"column",gap:3}}>
                          {(cr.google_descriptions||[]).map((d,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:6}}><span style={{fontSize:8.5,color:"#6a96aa",fontWeight:700,minWidth:22,paddingTop:1}}>D{i+1}</span><p style={{fontSize:11,color:"#bbd4e0",direction:"ltr",textAlign:"left",flex:1,lineHeight:1.5}}>{d}</p><span style={{fontSize:8,color:d.length>90?"#f07070":"#2e5468"}}>{d.length}/90</span></div>)}
                        </div>
                      </div>
                    )}
                    {/* Channel caption — for all social channels */}
                    {chan!=="Google Ads"&&(cr.caption||cr.captions)&&(
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <p style={{fontSize:8.5,color:"#6a96aa",textTransform:"uppercase",letterSpacing:".04em"}}>{chan} {T("كابشن","Caption")}</p>
                          <Btn ch={T("نسخ","Copy")} xs onClick={()=>copyText(cr.caption||cr.captions?.instagram||"")}/>
                        </div>
                        <div style={{padding:"10px 12px",background:"rgba(7,22,48,.7)",borderRadius:8,direction:"rtl"}}>
                          <p style={{fontSize:11,lineHeight:1.8,color:"#ddeef4"}}>{cr.caption||cr.captions?.instagram}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Btn ch={T("✦ أنشئ التصميم في استوديو التصميم","✦ Open in Design Studio")} line full onClick={()=>{setBMsg(cr.ad_copy?.hook||"");setBHook(cr.ad_copy?.hook||"");setBCta(cr.ad_copy?.cta||"");setTab("brief");}} style={{marginTop:4}}/>
              </div>
            )}
          </div>
        )}

        {tab==="campaign"&&(
          <div className="qa">
            <SH title={T("مولّد الحملات","Campaign Generator")} sub={T("بريف حملة كامل بنصوص لكل قناة","Full campaign brief with per-channel copy")}/>
            <ErrBox msg={campErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("تفاصيل الحملة","Campaign Details")}</span></div>
              <div style={cBody}>
                <Fld label={T("نوع الحملة","Type")}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{[["Seasonal",T("موسمية","Seasonal")],["Feature",T("ميزة جديدة","New Feature")],["ZATCA","ZATCA"],["Sector",T("قطاعية","Sector")],["Competitor",T("استحواذ منافس","Competitor")]].map(([v,l])=><Seg key={v} ch={l} on={campType===v} onClick={()=>setCampType(v)}/>)}</div></Fld>
                <Fld label={T("موضوع الحملة","Theme")}><input value={campTheme} onChange={e=>setCampTheme(e.target.value)} placeholder={T("مثال: اليوم الوطني · إطلاق POS","e.g. National Day · POS Launch")}/></Fld>
                <Fld label={T("الهدف","Objective")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {[["Leads",T("جذب عملاء","Leads")],["Direct Purchase",T("شراء مباشر","Direct Purchase")],["Engagement",T("تفاعل","Engagement")],["Awareness",T("وعي بالعلامة","Awareness")],["Product Announcement",T("إطلاق منتج","Product Announcement")]].map(([v,l])=><Seg key={v} ch={l} on={campObj===v} onClick={()=>setCampObj(v)}/>)}
                  </div>
                </Fld>
                <Fld label={T("القنوات","Channels")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {["Meta","TikTok","Snapchat","LinkedIn","Google","Twitter","Email"].map(v=><Seg key={v} ch={v} on={campChs.includes(v)} onClick={()=>setCampChs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v])}/>)}
                  </div>
                </Fld>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <Fld label={T("الميزانية (ريال)","Budget (SAR)")}><input type="number" value={campBudget} onChange={e=>setCampBudget(e.target.value)} placeholder={T("مثال: 15000","e.g. 15000")}/></Fld>
                  <Fld label={T("المدة (أسابيع)","Duration (weeks)")}><select value={campDuration} onChange={e=>setCampDuration(e.target.value)}>{["1","2","3","4","6","8","12"].map(w=><option key={w} value={w}>{w} {T("أسابيع","weeks")}</option>)}</select></Fld>
                  <Fld label={T("النطاق الجغرافي","Geo Scope")}><select value={campScope} onChange={e=>setCampScope(e.target.value)}>{[["Saudi Arabia",T("السعودية","Saudi Arabia")],["GCC",T("الخليج","GCC")],["MENA",T("الشرق الأوسط","MENA")]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Fld>
                </div>
                <Fld label={T("سياق إضافي","Context")}><textarea value={campCtx} onChange={e=>setCampCtx(e.target.value)} rows={2} placeholder={T("مثال: خصم 30% — إطلاق رمضان","e.g. 30% off — Ramadan launch")}/></Fld>
                <Btn ch={T("أنشئ الحملة الكاملة","Create Full Campaign")} gold onClick={genCampaign} dis={campLd} full/>
              </div>
            </div>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("مرجع الحملات","Campaign Reference")}</span></div>
              <div style={cBody}>
                {CAMPS.map(c=>(
                  <div key={c.id} onClick={()=>setCampTheme(lang==="en"?c.en:c.ar)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:"1px solid rgba(1,53,90,.45)",background:"rgba(7,22,48,.5)",marginBottom:5,cursor:"pointer",direction:"rtl"}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#17a3a3",minWidth:36}}>{c.id}</span>
                    <span style={{fontSize:11,color:"#ddeef4",flex:1,lineHeight:1.4,textAlign:"right"}}>{lang==="en"?c.en:c.ar}</span>
                    <div style={{display:"flex",gap:4}}><Tag ch={c.s} t style={{fontSize:9.5}}/><Tag ch={c.st} style={{fontSize:9.5}}/></div>
                  </div>
                ))}
              </div>
            </div>
            {/* ── Miro Integration Bar ── */}
            <div style={{...card,padding:0,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",background:"rgba(7,22,48,.6)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <svg width="20" height="20" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="10" fill="#FFD02F"/><text x="32" y="44" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="sans-serif" fill="#050038">M</text></svg>
                <span style={{fontSize:10.5,fontWeight:600,color:miroConn?"#5dc87a":"#6a96aa",flex:1}}>
                  {miroConn?T("Miro متصل — ابنِ مخطط النظام على لوحتك","Miro connected — build system workflow on your board"):T("اربط Miro لإنشاء مخطط النظام كاملاً","Connect Miro to generate the full system workflow diagram")}
                </span>
                {miroConn?(
                  <>
                    <button onClick={createMiroBoard} disabled={miroLd} style={{padding:"5px 14px",borderRadius:6,border:"none",background:"#FFD02F",color:"#050038",fontSize:10.5,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:miroLd?.6:1}}>
                      {miroLd?(
                        <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,border:"1.5px solid rgba(5,0,56,.3)",borderTopColor:"#050038",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>{T("يبني...","Building...")}</span>
                      ):T("✦ أنشئ لوحة Miro","✦ Create Miro Board")}
                    </button>
                    <button onClick={disconnectMiro} style={{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(240,112,112,.35)",background:"transparent",color:"#f07070",fontSize:9.5,cursor:"pointer",fontFamily:"inherit"}}>{T("قطع","Disconnect")}</button>
                  </>
                ):(
                  <button onClick={connectMiro} style={{padding:"5px 14px",borderRadius:6,border:"1px solid rgba(255,208,47,.4)",background:"rgba(255,208,47,.1)",color:"#FFD02F",fontSize:10.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{T("ربط Miro","Connect Miro")}</button>
                )}
              </div>
              {miroMsg&&<p style={{padding:"6px 14px",fontSize:10,color:"#5dc87a",margin:0,borderTop:"1px solid rgba(1,53,90,.3)"}}>{miroMsg}{miroBoardId&&<a href={`https://miro.com/app/board/${miroBoardId}/`} target="_blank" rel="noreferrer" style={{color:"#FFD02F",marginRight:8,textDecoration:"underline"}}> ← {T("افتح اللوحة","Open Board")}</a>}</p>}
              {miroErr&&<p style={{padding:"6px 14px",fontSize:10,color:"#f07070",margin:0,borderTop:"1px solid rgba(1,53,90,.3)"}}>{miroErr}</p>}
            </div>

            {campLd&&<Loader msg={T("يبني الحملة...","Building campaign...")}/>}
            {campRes&&!campLd&&(
              <div style={{...card,animation:"qrise .3s ease both"}}>
                <div style={cHead}><span style={{fontSize:12,fontWeight:600,color:"#17a3a3"}}>{campRes.campaign_name}</span><Tag ch={campRes.target_stage} t/></div>
                <div style={cBody}>
                  <Hook text={campRes.core_message}/><Hr/>
                  {(campRes.hooks||[]).sort((a,b)=>(b.strength||0)-(a.strength||0)).map((h,i)=>(
                    <div key={i} style={{padding:"8px 10px",borderRadius:7,background:"rgba(7,22,48,.6)",border:"1px solid rgba(1,53,90,.45)",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:9.5,color:"#2e5468",minWidth:14}}>{i+1}</span><span style={{fontSize:12.5,fontWeight:600,flex:1,direction:"rtl",textAlign:"right"}}>{h.text}</span>{i===0&&<Tag ch={T("الأقوى","Strongest")} g style={{fontSize:9.5}}/>}</div>
                      <div style={{display:"flex",gap:4}}><Tag ch={h.type} t style={{fontSize:9.5}}/><Tag ch={h.channel} style={{fontSize:9.5}}/></div>
                      <SBar v={h.strength||75}/>
                    </div>
                  ))}<Hr/>
                  {(campRes.ad_copies||[]).map((ad,i)=>(
                    <div key={i} style={{padding:"10px",borderRadius:7,background:"#0a1f3d",border:"1px solid rgba(1,53,90,.45)",marginBottom:7}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><Tag ch={ad.channel} t style={{fontSize:10.5}}/><Tag ch={ad.format} style={{fontSize:10.5}}/><Btn ch={T("نسخ","Copy")} xs style={{marginLeft:"auto"}} onClick={()=>copyText(`${ad.hook}\n\n${ad.body}\nCTA: ${ad.cta}`)}/></div>
                      <Hook text={ad.hook}/><p style={{fontSize:11.5,color:"#ddeef4",lineHeight:1.8,direction:"rtl",textAlign:"right",marginBottom:7}}>{ad.body}</p>
                      <div style={{display:"flex",gap:4}}><Tag ch={ad.cta} green style={{fontSize:10.5}}/><Tag ch={ad.trust} t style={{fontSize:10.5}}/></div>
                    </div>
                  ))}
                  {campRes.timeline&&(<><Hr/><p style={{fontSize:9.5,color:"#2e5468",marginBottom:7,textTransform:"uppercase",letterSpacing:".04em"}}>{T("الجدول الزمني","Timeline")} · {campRes.timeline.weeks} {T("أسابيع","weeks")}</p><div style={{display:"flex",flexDirection:"column",gap:5}}>{(campRes.timeline.phases||[]).map((ph,i)=><div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"rgba(7,22,48,.6)",borderRadius:6,border:"1px solid rgba(1,53,90,.3)"}}><div style={{minWidth:80,fontSize:9.5,color:"#17a3a3",fontWeight:600,direction:"ltr"}}>{ph.week}</div><div style={{flex:1,direction:"rtl"}}><p style={{fontSize:10.5,fontWeight:600,color:"#ddeef4",marginBottom:2}}>{ph.focus}</p><p style={{fontSize:10,color:"#6a96aa"}}>{ph.action}</p></div></div>)}</div></>)}
                  {campRes.kpis&&campRes.kpis.length>0&&(<><Hr/><p style={{fontSize:9.5,color:"#2e5468",marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"}}>KPIs</p><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{campRes.kpis.map((k,i)=><Tag key={i} ch={k} style={{fontSize:10.5,color:"#5dc87a",background:"rgba(93,200,122,.06)",border:"1px solid rgba(93,200,122,.2)"}}/>)}</div></>)}
                  {campRes.budget_split&&(<><Hr/><p style={{fontSize:9.5,color:"#2e5468",marginBottom:7,textTransform:"uppercase",letterSpacing:".04em"}}>{T("توزيع الميزانية","Budget Split")}{campBudget?` · ${Number(campBudget).toLocaleString()} SAR`:""}</p>{Object.entries(campRes.budget_split).map(([ch2,pct])=>{const pNum=parseInt(pct)||0;return(<div key={ch2} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:11,color:"#ddeef4",minWidth:64}}>{ch2}</span><div style={{flex:1,height:4,background:"rgba(255,255,255,.04)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:pct,background:"linear-gradient(90deg,#17a3a3,#13778d)",borderRadius:2}}/></div><span style={{fontSize:10.5,color:"#17a3a3",fontWeight:700,minWidth:28}}>{pct}</span>{campBudget&&<span style={{fontSize:9.5,color:"#2e5468",minWidth:48}}>{Math.round(Number(campBudget)*pNum/100).toLocaleString()} SAR</span>}</div>);})}</>)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="market"&&(
          <div className="qa">
            <SH title={T("مراقبة السوق","Market Watch")} sub={T("تحليل المنافسين وأنشئ نسخاً مضادة","Competitor analysis & counter-creatives")}/>
            <ErrBox msg={mErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("رادار المنافسين","Competitor Radar")}</span></div>
              <div style={cBody}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:7,marginBottom:12}}>
                  {COMPS.map(c=>(
                    <div key={c.id} onClick={()=>setMComp(lang==="en"?c.en:c.n)} style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${mComp===(lang==="en"?c.en:c.n)?"rgba(23,163,164,.45)":"rgba(1,53,90,.45)"}`,background:mComp===(lang==="en"?c.en:c.n)?"rgba(23,163,164,.1)":"#0a1f3d",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                        <div style={{width:24,height:24,borderRadius:5,background:c.lb,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10.5,fontWeight:800,color:"#fff",flexShrink:0}}>{c.lt}</div>
                        <div><div style={{fontSize:12,fontWeight:700,color:c.c}}>{lang==="en"?c.en:c.n}</div><span style={{fontSize:9,padding:"1px 5px",borderRadius:3,fontWeight:600,...(c.thr==="high"?{background:"rgba(240,112,112,.12)",color:"#f07070"}:c.thr==="mid"?{background:"rgba(245,166,35,.12)",color:"#f5a623"}:{background:"rgba(93,200,122,.1)",color:"#5dc87a"})}}>{c.thr==="high"?T("عالي","High"):c.thr==="mid"?T("متوسط","Med"):T("منخفض","Low")}</span></div>
                      </div>
                      <div style={{fontSize:10,color:"#2e5468",lineHeight:1.4}}>{lang==="en"?c.wae:c.war}</div>
                    </div>
                  ))}
                </div>
                <Btn ch={T("ابدأ التحليل الآن","Start Analysis Now")} onClick={runScan} dis={mLd} full/>
              </div>
            </div>
            <div style={{...card,marginTop:10}}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("تحليل إعلان منافس","Analyze Competitor Ad")}</span></div>
              <div style={cBody}>
                <div style={row2}>
                  <Fld label={T("المنافس","Competitor")}><select value={mComp} onChange={e=>setMComp(e.target.value)}><option value="">{T("— اختر —","— Select —")}</option>{COMPS.map(c=><option key={c.id} value={lang==="en"?c.en:c.n}>{lang==="en"?c.en:c.n}</option>)}</select></Fld>
                  <Fld label={T("القناة","Channel")}><select value={mChan} onChange={e=>setMChan(e.target.value)}>{["Instagram","Facebook","TikTok","Snapchat","LinkedIn","Twitter/X"].map(v=><option key={v}>{v}</option>)}</select></Fld>
                </div>
                <Fld label={T("وصف الإعلان","Ad Description")}><textarea value={mDesc} onChange={e=>setMDesc(e.target.value)} rows={3} placeholder={T("صف الإعلان: الجملة الافتتاحية، الرسالة...","Describe: hook, message, format...")}/></Fld>
                <Btn ch={T("أنشئ النسخة المضادة","Create Counter-Creative")} onClick={genCounter} dis={mLd} full/>
              </div>
            </div>
            {mLd&&<Loader msg={T("يحلل...","Analyzing...")}/>}
            {mRes&&!mLd&&(
              <div className="qa">
                {(mRes.cards||[]).map((c,i)=>(
                  <div key={i} style={{...card}}>
                    <div style={cHead}><Tag ch={c.competitor} style={{fontWeight:700}}/><Tag ch={c.platform||mChan} style={{fontSize:10}}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                      <div style={{padding:"12px 13px",borderLeft:"1px solid rgba(1,53,90,.45)"}}>
                        <p style={{fontSize:9,fontWeight:700,color:"#2e5468",marginBottom:8,textTransform:"uppercase"}}>{T("إعلان المنافس","Competitor Ad")}</p>
                        <p style={{fontSize:9.5,color:"#2e5468",marginBottom:2}}>{T("الجملة الافتتاحية","Hook")}</p><p style={{fontSize:11.5,color:"#ddeef4",direction:"rtl",textAlign:"right",marginBottom:8}}>{c.hook}</p>
                        <p style={{fontSize:9.5,color:"#2e5468",marginBottom:2}}>{T("الرسالة","Message")}</p><p style={{fontSize:11.5,color:"#ddeef4",direction:"rtl",textAlign:"right",marginBottom:6}}>{c.message}</p>
                        <div style={{fontSize:10,color:"#6a96aa",padding:"6px 8px",background:"rgba(245,166,35,.04)",borderRadius:5,marginBottom:4}}>{c.why_works}</div>
                        <p style={{fontSize:10,color:"#f07070"}}>{T("ثغرة: ","Gap: ")}{c.weakness}</p>
                      </div>
                      <div style={{padding:"12px 13px"}}>
                        {c.counter?<>
                          <p style={{fontSize:9,fontWeight:700,color:"#2e5468",marginBottom:8,textTransform:"uppercase"}}>{T("نسخة قيود المضادة","Qoyod Counter")}</p>
                          <Hook text={c.counter.hook_ar}/>
                          <p style={{fontSize:11.5,color:"#ddeef4",lineHeight:1.8,direction:"rtl",textAlign:"right",marginBottom:6}}>{c.counter.body_ar}</p>
                          <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}><Tag ch={c.counter.cta_ar} green style={{fontSize:10}}/><Tag ch={c.counter.trust} t style={{fontSize:10}}/><Tag ch={c.counter.funnel} style={{fontSize:10}}/></div>
                          <Btn ch={T("نسخ","Copy")} xs onClick={()=>copyText(`${c.counter.hook_ar}\n\n${c.counter.body_ar}\nCTA: ${c.counter.cta_ar}`)}/>
                        </>:"—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="brief"&&(
          <div className="qa">
            <SH title={T("استوديو التصميم","Design Studio")} sub={T("حدّد عدد النسخ ثم أنشئ التصاميم مباشرةً","Choose variants count then generate designs directly")}/>
            <ErrBox msg={bErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("تفاصيل التصميم","Design Details")}</span></div>
              <div style={cBody}>
                <div style={row2}>
                  <Fld label={T("المنتج / الخدمة / العرض","Product / Service / Offer")}><GroupedProductChips selected={bProd} onSelect={setBProd} lang={lang} extras={bProdExtras} onToggleExtra={v=>toggleExtra(v,setBProdExtras)}/></Fld>
                  <Fld label={T("عنصر الثقة","Trust")}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{[["ZATCA Logo","ZATCA"],["Approved","معتمد"],["25K Companies","25K"],["SOCPA","SOCPA"]].map(([v,l])=><Seg key={v} ch={l} on={bTrust===v} onClick={()=>setBTrust(v)}/>)}</div></Fld>
                </div>
                <div style={row2}>
                  <Fld label={T("الشريحة المستهدفة","Target Persona")}>
                    <select value={bPersona} onChange={e=>setBPersona(e.target.value)}>
                      <option value="">{T("— تلقائي —","— Auto —")}</option>
                      <option value="P1">P1 · Ahmed — صاحب بقالة / محل صغير</option>
                      <option value="P2">P2 · Fatima — مديرة مطعم / كوفي</option>
                      <option value="P3">P3 · Khalid — مقاول / مشاريع</option>
                      <option value="P4">P4 · Sarah — مؤسسة متجر إلكتروني</option>
                      <option value="P5">P5 · Omar — طبيب / عيادة</option>
                      <option value="P6">P6 · Ali — CFO / Finance Director</option>
                    </select>
                  </Fld>
                  <Fld label={T("القطاع","Sector")}>
                    <select value={bSector} onChange={e=>setBSector(e.target.value)}>
                      <option value="">{T("— تلقائي —","— Auto —")}</option>
                      <option value="retail">{T("التجزئة","Retail")}</option>
                      <option value="f&b">{T("المطاعم والكافيهات","F&B")}</option>
                      <option value="construction">{T("المقاولات","Construction")}</option>
                      <option value="e-commerce">{T("التجارة الإلكترونية","E-commerce")}</option>
                      <option value="healthcare">{T("الصحة","Healthcare")}</option>
                      <option value="enterprise">{T("شركات كبيرة / مؤسسات","Enterprise / Finance")}</option>
                      <option value="bookkeeping">{T("مسك الدفاتر","Bookkeeping Service")}</option>
                    </select>
                  </Fld>
                </div>
                <Fld label={T("الرسالة الرئيسية","Main Message")}><input value={bMsg} onChange={e=>setBMsg(e.target.value)} placeholder={T("مثال: فواتير إلكترونية معتمدة","e.g. certified invoices")}/></Fld>
                <div style={row2}>
                  <Fld label={T("الجملة الافتتاحية (اختياري)","Hook (optional)")}>
                    <input value={bHook} onChange={e=>setBHook(e.target.value)} placeholder={T("مثال: هل تعاني من الفواتير اليدوية؟","e.g. Struggling with manual invoices?")}/>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
                      {[
                        T("هل تعاني من الفواتير اليدوية؟","Tired of manual invoices?"),
                        T("تخيّل لو محاسبتك تشتغل وحدها","Imagine your accounting runs itself"),
                        T("٩٠٪ من أصحاب الأعمال يخسرون بسبب الأخطاء","90% of businesses lose due to errors"),
                        T("بدون تعقيد — كل أعمالك من مكان واحد","No complexity — run everything from one place"),
                      ].map(s=>(
                        <button key={s} onClick={()=>setBHook(s)} style={{padding:"3px 8px",borderRadius:20,border:"1px solid rgba(23,163,164,.3)",background:bHook===s?"rgba(23,163,164,.18)":"rgba(23,163,164,.06)",color:bHook===s?"#17a3a3":"#4a8fa0",fontSize:9.5,cursor:"pointer",fontFamily:"inherit",direction:"rtl",transition:"all .15s"}}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Fld>
                  <Fld label="CTA">
                    <input value={bCta} onChange={e=>setBCta(e.target.value)} placeholder={T("مثال: ابدأ تجربتك المجانية","e.g. Start Free Trial")}/>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
                      {[
                        T("ابدأ تجربتك المجانية","Start Free Trial"),
                        T("سجّل الآن","Register Now"),
                        T("جرّب مجاناً","Try for Free"),
                        T("احجز عرضاً","Book a Demo"),
                        T("تواصل معنا","Contact Us"),
                        T("اكتشف المزيد","Learn More"),
                      ].map(s=>(
                        <button key={s} onClick={()=>setBCta(s)} style={{padding:"3px 8px",borderRadius:20,border:"1px solid rgba(23,163,164,.3)",background:bCta===s?"rgba(23,163,164,.18)":"rgba(23,163,164,.06)",color:bCta===s?"#17a3a3":"#4a8fa0",fontSize:9.5,cursor:"pointer",fontFamily:"inherit",direction:"rtl",transition:"all .15s"}}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Fld>
                </div>
                <Fld label={T("المقاسات","Placements")}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{["1:1","4:5","9:16","16:9"].map(v=><Seg key={v} ch={v} on={bPlaces.includes(v)} onClick={()=>setBPlaces(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v])}/>)}</div></Fld>
                <Fld label={T("الأسلوب البصري / المشهد","Visual Style / Mockup")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {INSPOS.map(s=><Seg key={s.v} ch={lang==="ar"?s.ar:s.v} on={bStyle===s.v} onClick={()=>setBStyle(s.v)}/>)}
                  </div>
                </Fld>
                <Fld label={T("نموذج توليد الصورة","Image Generation Model")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {[
                      ["nano_banana_2", "Nano Banana 2 ★"],
                      ["auto",          T("تلقائي","Auto")],
                      ["gpt-image",     "GPT Image 1"],
                      ["nanobanana",    "Nano Banana (Flash 2.0)"],
                      ["nanobanana-25", "Nano Banana (Flash 2.5)"],
                      ["imagen3",       "Imagen 3"],
                      ["imagen4",       "Imagen 4"],
                      ["veo2",          "Veo 2 🎬"],
                      ["veo3",          "Veo 3 🎬"],
                    ].map(([v,l])=>(
                      <Seg key={v} ch={l} on={imageProvider===v} onClick={()=>setImageProvider(v)}/>
                    ))}
                  </div>
                  {(imageProvider==="veo2"||imageProvider==="veo3")&&(
                    <div style={{fontSize:10,color:"#f59e0b",marginTop:4}}>⚠ {T("Veo يولد فيديو — بدون تركيب نص عربي","Veo generates video — no Arabic text overlay")}</div>
                  )}
                </Fld>
                <Fld label={T("عدد النسخ","Variants")}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{[1,2,3,4,5].map(n=><Seg key={n} ch={n} on={numVariants===n} onClick={()=>setNumVariants(n)}/>)}</div></Fld>
                <Btn ch={T(`✦ أنشئ ${numVariants} تصميم الآن`,`✦ Generate ${numVariants} Design${numVariants>1?"s":""} Now`)} onClick={genDirectDesigns} dis={bLd} full/>
                <button onClick={genBrief} disabled={bLd} style={{marginTop:4,width:"100%",padding:"5px",borderRadius:6,border:"1px solid rgba(106,150,170,.3)",background:"transparent",color:"#6a96aa",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{T("توليد بريف فقط (بدون SVG)","Generate Brief Only (no SVG)")}</button>
              </div>
            </div>
            {bLd&&<Loader msg={T("ينشئ...","Creating...")}/>}
            {bRes&&!bLd&&(
              <div className="qa">
                {/* ── Canva connect bar ── */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 12px",borderRadius:8,border:"1px solid rgba(1,53,90,.45)",background:"rgba(7,22,48,.5)",flexWrap:"wrap"}}>
                  <span style={{fontSize:10.5,fontWeight:600,color:"#17a3a3",flex:"1 1 200px"}}>✦ {T("نموذج توليد الصورة","Image generation model")}</span>
                  <div style={{display:"flex",background:"#0a1f3d",border:"1px solid rgba(1,53,90,.45)",borderRadius:5,overflow:"hidden",height:26}}>
                    {[["nano_banana_2","NB2 ★"],["auto","Auto"],["gpt-image","GPT Image"],["nanobanana","NB Flash 2"],["nanobanana-25","NB Flash 2.5"],["imagen3","Imagen 3"],["imagen4","Imagen 4"],["veo2","Veo 2🎬"],["veo3","Veo 3🎬"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setImageProvider(v)} style={{padding:"0 10px",height:"100%",background:imageProvider===v?"rgba(23,163,164,.15)":"none",border:"none",color:imageProvider===v?"#17a3a3":"#6a96aa",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  <p style={{fontSize:12,fontWeight:600,color:"#17a3a3",margin:0}}>{bRes.brief_title}</p>
                  <button onClick={genAllDesigns} style={{padding:"5px 14px",borderRadius:6,border:"1px solid rgba(23,163,164,.4)",background:"rgba(23,163,164,.08)",color:"#17a3a3",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                    ✦ {T(`أنشئ تصاميم الكل (${numVariants})`,`Generate All Visuals (${numVariants})`)}
                  </button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:numVariants===1?"1fr":numVariants===2?"repeat(2,1fr)":"repeat(auto-fill,minmax(360px,1fr))",gap:14,marginBottom:14}}>
                  {Array.from({length:numVariants},(_,i)=>i+1).map(num=>{
                    const data=bRes[`variant${num}`];
                    const png=designPngs[num];
                    const provider=designProviders[num];
                    const ld=designLds[num];
                    const err=designErrs[num];
                    return(
                      <div key={num} style={{...card,marginBottom:0,border:appV===num?"1.5px solid rgba(93,200,122,.5)":"1px solid rgba(1,53,90,.45)"}}>
                        <div style={{...cHead,background:appV===num?"rgba(93,200,122,.06)":"rgba(23,163,164,.03)"}}>
                          <span style={{fontSize:11,fontWeight:600,color:appV===num?"#5dc87a":"#17a3a3"}}>{T(`نسخة ${num}`,`Variant ${num}`)}</span>
                          <div style={{display:"flex",gap:5,alignItems:"center"}}>
                            {provider&&<Tag ch={provider==="nano_banana_2"?"NB2 ★":provider==="nanobanana"?"Nano Banana":provider==="gpt-image"?"GPT Image":provider} t style={{fontSize:8.5}}/>}
                            {appV===num&&<Tag ch="✓" green style={{fontSize:9.5}}/>}
                          </div>
                        </div>
                        <div style={{padding:12}}>
                          {png?(
                            <div style={{marginBottom:10}}>
                              <div style={{borderRadius:8,overflow:"hidden",border:"1px solid rgba(23,163,164,.25)",marginBottom:8,background:"#021544",width:"100%"}}>
                                <img
                                  src={png}
                                  alt={`Variant ${num} preview`}
                                  style={{width:"100%",height:"auto",display:"block"}}
                                />
                              </div>
                              <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                                <button onClick={()=>downloadRaster(png,num,"png")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"1px solid rgba(23,163,164,.4)",background:"rgba(23,163,164,.1)",color:"#17a3a3",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                                  {T("تحميل PNG","Download PNG")}
                                </button>
                                <button onClick={()=>downloadRaster(png,num,"jpg")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"1px solid rgba(23,163,164,.4)",background:"rgba(23,163,164,.1)",color:"#17a3a3",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                                  {T("تحميل JPG","Download JPG")}
                                </button>
                                <button onClick={async()=>{const blob=dataUrlToBlob(png);const file=new File([blob],`qoyod-design-v${num}.png`,{type:"image/png"});const fd=new FormData();fd.append("file",file);fd.append("name",file.name);try{setDriveLd(p=>({...p,[`png-${num}`]:true}));const r=await fetch("/api/drive/upload",{method:"POST",body:fd});const d=await r.json();if(!r.ok||d.error)throw new Error(d.error||"Drive upload failed");setDriveLinks(p=>({...p,[`png-${num}`]:d.link}));}catch(e){setDriveErrs(p=>({...p,[`png-${num}`]:e.message}));}finally{setDriveLd(p=>({...p,[`png-${num}`]:false}));}}} disabled={driveLd[`png-${num}`]} style={{padding:"6px 10px",borderRadius:6,border:"1px solid rgba(66,133,244,.4)",background:"rgba(66,133,244,.1)",color:driveLinks[`png-${num}`]?"#5dc87a":"#4285f4",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:driveLd[`png-${num}`]?.6:1}} title="Save to Google Drive">
                                  {driveLd[`png-${num}`]?"…":driveLinks[`png-${num}`]?"Drive ✓":"Drive"}
                                </button>
                                <button onClick={()=>genDesign(num)} style={{padding:"6px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,.1)",background:"none",color:"#6a96aa",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
                                  {T("أعد الإنشاء","Retry")}
                                </button>
                              </div>
                              {driveLinks[`png-${num}`]&&<p style={{fontSize:9,marginBottom:4,textAlign:"center"}}><a href={driveLinks[`png-${num}`]} target="_blank" rel="noreferrer" style={{color:"#4285f4",textDecoration:"underline"}}>↗ {T("افتح في Drive","Open in Drive")}</a></p>}
                              {driveErrs[`png-${num}`]&&<p style={{fontSize:9,color:"#f07070",marginBottom:4,textAlign:"center"}}>{driveErrs[`png-${num}`]}</p>}
                              {/* ── Open in Canva (deep-link, no OAuth) ── */}
                              <button onClick={()=>openInCanva(png,num)} disabled={canvaLd} style={{width:"100%",padding:"7px 0",borderRadius:6,border:"1px solid rgba(125,42,232,.45)",background:"rgba(125,42,232,.12)",color:"#b87fff",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                                <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#7D2AE8"/><path d="M8 21.6C9.92 24.12 12.72 25.6 16 25.6c5.3 0 9.6-4.3 9.6-9.6S21.3 6.4 16 6.4c-3.28 0-6.08 1.48-8 3.92V6.4H4V22.4l4-.8V21.6z" fill="#fff"/></svg>
                                {T("افتح في Canva","Open in Canva")}
                              </button>
                              {canvaMsg[num]?.info&&<p style={{fontSize:9,color:"#6a96aa",marginTop:4,textAlign:"center"}}>{canvaMsg[num].info}</p>}
                              {canvaMsg[num]?.ok&&<p style={{fontSize:9,color:"#5dc87a",marginTop:4,textAlign:"center"}}>{canvaMsg[num].ok}</p>}
                              {canvaMsg[num]?.err&&<p style={{fontSize:9,color:"#f07070",marginTop:4,textAlign:"center"}}>{canvaMsg[num].err}</p>}
                              {designPrompts[num]&&<details style={{marginTop:8,paddingTop:6,borderTop:"1px solid rgba(1,53,90,.4)"}}><summary style={{fontSize:9,color:"#6a96aa",cursor:"pointer"}}>{T("عرض موجه الصورة","Show image prompt")}</summary><p style={{fontSize:9,color:"#6a96aa",marginTop:5,lineHeight:1.5,fontStyle:"italic"}}>{designPrompts[num]}</p></details>}
                            </div>
                          ):ld?(
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"20px 0",marginBottom:10}}>
                              <div style={{width:28,height:28,border:"2px solid rgba(23,163,164,.2)",borderTopColor:"#17a3a3",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
                              <span style={{fontSize:10,color:"#6a96aa"}}>{T("يولّد التصميم...","Generating visual...")}</span>
                            </div>
                          ):(
                            <div style={{marginBottom:10}}>
                              <div style={{display:"flex",justifyContent:"center",padding:10,background:"rgba(2,12,30,.6)",borderRadius:7,marginBottom:8}}><Mockup hl={bMsg.slice(0,32)} hk={bHook.slice(0,38)} ct={bCta||T("ابدأ الآن","Start Now")} ratio="1:1" prod={bProd} variant={num<=2?num:1}/></div>
                              {err&&<p style={{fontSize:10,color:"#f07070",marginBottom:6,textAlign:"center"}}>{err}</p>}
                              <button onClick={()=>genDesign(num)} style={{width:"100%",padding:"8px 0",borderRadius:7,border:"1.5px solid rgba(23,163,164,.5)",background:"rgba(23,163,164,.08)",color:"#17a3a3",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600,letterSpacing:.3}}>
                                ✦ {T("أنشئ التصميم","Generate Visual")}
                              </button>
                            </div>
                          )}
                          <p style={{fontSize:10,fontWeight:600,color:"#ddeef4",marginBottom:4}}>{data?.concept}</p>
                          <p style={{fontSize:10.5,color:"#6a96aa",lineHeight:1.6,marginBottom:8}}>{data?.art_direction}</p>
                        </div>
                        <div style={{padding:"10px 12px",borderTop:"1px solid rgba(1,53,90,.45)"}}>
                          {appV===num?<div style={{fontSize:11,color:"#5dc87a",textAlign:"center"}}>✓ {T("معتمدة","Approved")}</div>:<Btn ch={T(`وافق`,`Approve`)} gold={num===1} full onClick={()=>setAppV(num)}/>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:14,padding:"12px 0 0",borderTop:"1px solid rgba(1,53,90,.35)"}}>
                  <ErrBox msg={specErr}/>
                  {!specRes&&<Btn ch={specLd?T("يولّد المواصفات...","Generating specs..."):T("أنشئ مواصفات الإعلان لهذا البريف","Generate Ad Specs for This Brief")} line onClick={genSpecFromBrief} dis={specLd} full/>}
                  {specLd&&<Loader msg={T("يجمع المواصفات التقنية...","Collecting technical specs...")}/>}
                  {specRes&&!specLd&&(
                    <div style={{marginTop:8}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <span style={{fontSize:11.5,fontWeight:600,color:"#17a3a3"}}>{T("مواصفات الإعلان","Ad Specs")}</span>
                        <Btn ch={T("مسح","Clear")} xs onClick={()=>setSpecRes(null)}/>
                      </div>
                      {(specRes.platforms||[]).map((pl,pi)=>(
                        <div key={pi} style={{marginBottom:12}}>
                          <p style={{fontSize:11,fontWeight:700,color:"#f5a623",marginBottom:6,paddingBottom:4,borderBottom:"1px solid rgba(1,53,90,.35)"}}>{pl.platform}</p>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:7}}>
                            {(pl.formats||[]).map((fm,fi)=>(
                              <div key={fi} style={{padding:"9px 11px",borderRadius:7,border:"1px solid rgba(1,53,90,.45)",background:"rgba(7,22,48,.5)"}}>
                                <p style={{fontSize:10.5,fontWeight:700,color:"#17a3a3",marginBottom:5}}>{fm.format} · {fm.aspect_ratio}</p>
                                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                                  {[["Dimensions",fm.dimensions],["File Size",fm.max_file_size],["Headline",fm.headline_chars],["Body",fm.body_chars],["Safe Zone",fm.safe_zone]].filter(([,v])=>v).map(([l,v])=>(
                                    <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                                      <span style={{color:"#2e5468"}}>{l}</span>
                                      <span style={{color:"#ddeef4",fontWeight:500}}>{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="landing"&&(
          <div className="qa">
            <SH title={T("صفحات الوصول","Landing Pages")} sub={T("حلّل صفحة منافس وأنشئ صفحة HTML جاهزة","Analyze competitor → get HTML ready to deploy")}/>
            <ErrBox msg={lpErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("الإعدادات","Settings")}</span></div>
              <div style={cBody}>
                <Fld label={T("المنتج / الخدمة / العرض","Product / Service / Offer")}><GroupedProductChips selected={lpProd} onSelect={setLpProd} lang={lang}/></Fld>
                <div style={row2}>
                  <Fld label={T("الهدف","Goal")}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {["Leads","Trial","Demo","Awareness"].map(g=><Seg key={g} ch={g} on={lpGoal===g} onClick={()=>setLpGoal(g)}/>)}
                    </div>
                  </Fld>
                  <Fld label={T("القطاع","Sector")}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {SECTORS.slice(0,5).map(s=><Seg key={s.v} ch={lang==="ar"?s.ar:s.en} on={lpSector===s.v} onClick={()=>setLpSector(s.v)}/>)}
                    </div>
                  </Fld>
                </div>
                <Fld label={T("رابط صفحة المنافس (اختياري)","Competitor page URL (optional)")}><input value={lpCompUrl} onChange={e=>setLpCompUrl(e.target.value)} placeholder="https://www.foodics.com/ar/..."/></Fld>
                <Fld label={T("وصف الصفحة أو العرض","Page / offer description")}><textarea value={lpCompDesc} onChange={e=>setLpCompDesc(e.target.value)} rows={3} dir="rtl" style={{textAlign:"right"}} placeholder={T("مثال: صفحة عرض رمضان من فودكس — خصم ٨٠٪ على نظام المطاعم","e.g. Foodics Ramadan offer page — 80% off F&B POS")}/></Fld>
                <Btn ch={T("① حلّل وأنشئ الاستراتيجية","① Analyze & Build Strategy")} gold onClick={genLP} dis={lpLd} full/>
              </div>
            </div>
            {lpLd&&<Loader msg={T("يحلل صفحة المنافس...","Analyzing competitor page...")}/>}
            {lpRes&&!lpLd&&(
              <div className="qa">
                <div style={card}>
                  <div style={cHead}><span style={{fontSize:12,fontWeight:600,color:"#f5a623"}}>{T("تحليل المنافس","Competitor Analysis")}</span></div>
                  <div style={cBody}>
                    <Hook text={lpRes.comp_analysis?.hero_message}/>
                    <div style={row2}>
                      <div><p style={{fontSize:9.5,color:"#5dc87a",marginBottom:6}}>✓ {T("يعمل","Works")}</p><p style={{fontSize:11.5,direction:"rtl",textAlign:"right"}}>{lpRes.comp_analysis?.what_works}</p></div>
                      <div><p style={{fontSize:9.5,color:"#f07070",marginBottom:6}}>⚠ {T("تحسين","Improve")}</p><p style={{fontSize:11.5,direction:"rtl",textAlign:"right"}}>{lpRes.comp_analysis?.what_to_improve}</p></div>
                    </div>
                  </div>
                </div>
                <div style={card}>
                  <div style={cHead}><span style={{fontSize:12,fontWeight:600,color:"#17a3a3"}}>{T("استراتيجية قيود","Qoyod LP Strategy")}</span></div>
                  <div style={cBody}>
                    <Hook text={lpRes.qoyod_lp?.page_title}/>
                    <p style={{fontSize:14,fontWeight:700,direction:"rtl",textAlign:"right",lineHeight:1.6,color:"#fff",marginBottom:6}}>{lpRes.qoyod_lp?.hero?.headline}</p>
                    <p style={{fontSize:11.5,color:"#6a96aa",direction:"rtl",textAlign:"right",marginBottom:10}}>{lpRes.qoyod_lp?.hero?.subline}</p>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                      <span style={{padding:"4px 12px",borderRadius:20,background:"rgba(23,163,164,.15)",border:"1px solid rgba(23,163,164,.3)",fontSize:10.5,color:"#17a3a3"}}>{lpRes.qoyod_lp?.hero?.cta_primary}</span>
                      <span style={{padding:"4px 12px",borderRadius:20,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",fontSize:10.5,color:"#aac"}}>{lpRes.qoyod_lp?.hero?.cta_secondary}</span>
                    </div>
                    {(lpRes.qoyod_lp?.sections||[]).map((sec,i)=>(
                      <div key={i} style={{padding:"8px 10px",marginBottom:6,borderRadius:6,background:"rgba(1,53,90,.25)",borderRight:"2px solid rgba(23,163,164,.3)"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#f5a623",marginBottom:3}}>{sec.name}</div>
                        <div style={{fontSize:11,color:"#aac",direction:"rtl",textAlign:"right",lineHeight:1.5}}>{sec.content}</div>
                      </div>
                    ))}
                    <div style={{marginTop:14,padding:"10px 0",borderTop:"1px solid rgba(1,53,90,.45)"}}>
                      <ErrBox msg={lpHtmlErr}/>
                      {lpQuickErr&&<p style={{fontSize:10,color:"#f07070",marginBottom:6,direction:"rtl",textAlign:"right"}}>{lpQuickErr}</p>}
                      {/* Quick-export row — always visible after strategy */}
                      {!lpHtml&&(
                        <>
                          <p style={{fontSize:10,color:"#6a96aa",marginBottom:8,direction:"rtl",textAlign:"right"}}>② {T("اختر وجهة التصدير — يتم إنشاء الصفحة وتصديرها مباشرةً","Choose export destination — page is generated and exported in one step")}</p>
                          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}>
                            <button onClick={()=>genLPHtmlAndExport("dl")} disabled={lpQuickDlLd||lpQuickWpLd||lpQuickHsLd} style={{flex:1,minWidth:110,padding:"8px 6px",borderRadius:7,border:"none",background:"#17a3a3",color:"#fff",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:700,opacity:(lpQuickDlLd||lpQuickWpLd||lpQuickHsLd)?.6:1}}>
                              {lpQuickDlLd?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><span style={{width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>{T("ينشئ...","Building...")}</span>:"⬇ "+T("تحميل HTML","Download HTML")}
                            </button>
                            <button onClick={()=>genLPHtmlAndExport("wp")} disabled={lpQuickDlLd||lpQuickWpLd||lpQuickHsLd} style={{flex:1,minWidth:110,padding:"8px 6px",borderRadius:7,border:"none",background:"#21759b",color:"#fff",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:700,opacity:(lpQuickDlLd||lpQuickWpLd||lpQuickHsLd)?.6:1}}>
                              {lpQuickWpLd?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><span style={{width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>{T("يرفع...","Uploading...")}</span>:"⬆ WordPress"}
                            </button>
                            <button onClick={()=>genLPHtmlAndExport("hs")} disabled={lpQuickDlLd||lpQuickWpLd||lpQuickHsLd} style={{flex:1,minWidth:110,padding:"8px 6px",borderRadius:7,border:"none",background:"#ff7a59",color:"#fff",fontSize:10.5,cursor:"pointer",fontFamily:"inherit",fontWeight:700,opacity:(lpQuickDlLd||lpQuickWpLd||lpQuickHsLd)?.6:1}}>
                              {lpQuickHsLd?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><span style={{width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>{T("يرفع...","Uploading...")}</span>:"⬆ HubSpot"}
                            </button>
                          </div>
                          <button onClick={genLPHtml} disabled={lpHtmlLd} style={{width:"100%",padding:"6px",borderRadius:6,border:"1px solid rgba(255,255,255,.12)",background:"transparent",color:"#6a96aa",fontSize:10,cursor:"pointer",fontFamily:"inherit",opacity:lpHtmlLd?.6:1}}>
                            {lpHtmlLd?T("ينشئ...","Generating..."):"+ "+T("أو أنشئ فقط لمراجعتها أولاً","or generate first to review before exporting")}
                          </button>
                          {lpHtmlLd&&<Loader msg={T("ينشئ Variant A...","Building Variant A...")}/>}
                        </>
                      )}
                      {lpHtml&&!lpHtmlB&&(
                        <>
                          <Btn ch={lpHtmlBLd?T("ينشئ B...","Generating B..."):"③ "+T("أنشئ Variant B — ثقة وامتثال (A/B Test)","Generate Variant B — Trust/Compliance (A/B)")} onClick={genLPHtmlB} dis={lpHtmlBLd} full/>
                          {lpHtmlBLd&&<Loader msg={T("ينشئ Variant B — زاوية الثقة والامتثال...","Building Variant B — Trust angle...")}/>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {(lpHtml||lpHtmlB)&&(
                  <div className="qa">
                    {/* WordPress Settings */}
                    <div style={card}>
                      <div style={{...cHead,cursor:"pointer"}} onClick={()=>setWpShowSettings(s=>!s)}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>⚙ {T("إعدادات WordPress","WordPress Settings")}</span>
                          {wpConfigured&&<span style={{fontSize:9.5,padding:"2px 8px",borderRadius:10,background:"rgba(93,200,122,.12)",border:"1px solid rgba(93,200,122,.3)",color:"#5dc87a",fontWeight:600}}>✓ {T("مُعدٌّ مسبقاً","Pre-configured")}</span>}
                        </div>
                        <span style={{fontSize:10,color:"#2e5468"}}>{wpShowSettings?"▲":"▼"}</span>
                      </div>
                      {wpShowSettings&&(
                        <div style={{...cBody,display:"flex",flexDirection:"column",gap:8}}>
                          {wpConfigured&&(
                            <p style={{fontSize:10,color:"#5dc87a",direction:"rtl",textAlign:"right",margin:0,padding:"6px 10px",background:"rgba(93,200,122,.06)",borderRadius:6,border:"1px solid rgba(93,200,122,.2)"}}>
                              ✓ {T("بيانات الاعتماد مخزّنة على الخادم — ليست بحاجة لإعادة الإدخال","Credentials stored on server — no need to re-enter")}
                            </p>
                          )}
                          <div style={row2}>
                            <Fld label={T("رابط الموقع","Site URL")}><input value={wpUrl} onChange={e=>setWpUrl(e.target.value)} placeholder="https://yoursite.com"/></Fld>
                            <Fld label={T("اسم المستخدم","Username")}><input value={wpUser} onChange={e=>setWpUser(e.target.value)} placeholder="admin"/></Fld>
                          </div>
                          {!wpConfigured&&(
                            <Fld label={T("Application Password (من WP Admin)","Application Password (from WP Admin)")}><input type="password" value={wpPass} onChange={e=>setWpPass(e.target.value)} placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"/></Fld>
                          )}
                          {wpConfigured&&(
                            <div style={{padding:"6px 10px",background:"rgba(7,22,48,.5)",borderRadius:6,border:"1px solid rgba(1,53,90,.3)"}}>
                              <span style={{fontSize:10,color:"#2e5468"}}>🔒 {T("كلمة المرور مخزّنة بأمان على الخادم","Application Password stored securely on server")}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Variant A */}
                    {lpHtml&&(
                      <div style={card}>
                        <div style={{...cHead,background:"rgba(23,163,164,.08)"}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#17a3a3"}}>✅ Variant A — {T("قيمة وسهولة الاستخدام","Value & Ease")}</span>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <button onClick={copyLP} style={{padding:"4px 10px",borderRadius:5,border:"1px solid rgba(23,163,164,.4)",background:"rgba(23,163,164,.1)",color:"#17a3a3",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{lpCopied?"✓":T("نسخ","Copy")}</button>
                            <button onClick={downloadLP} style={{padding:"4px 10px",borderRadius:5,border:"none",background:"#17a3a3",color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>⬇ HTML</button>
                            <button onClick={()=>uploadToDrive(lpHtml,"qoyod-landing-A.html","text/html","lp-a")} disabled={driveLd["lp-a"]} style={{padding:"4px 10px",borderRadius:5,border:"1px solid rgba(66,133,244,.4)",background:"rgba(66,133,244,.1)",color:driveLinks["lp-a"]?"#5dc87a":"#4285f4",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:driveLd["lp-a"]?.6:1}}>
                              {driveLd["lp-a"]?"↑…":driveLinks["lp-a"]?<a href={driveLinks["lp-a"]} target="_blank" rel="noreferrer" style={{color:"#5dc87a",textDecoration:"none"}}>✓ Drive</a>:"☁ Drive"}
                            </button>
                            {(wpConfigured||(wpUrl&&wpUser&&wpPass))&&(
                              <button onClick={()=>uploadToWP(lpHtml,"A")} disabled={wpUploadingA} style={{padding:"4px 10px",borderRadius:5,border:"none",background:"#21759b",color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:wpUploadingA?.6:1}}>
                                {wpUploadingA?T("يرفع...","Uploading..."):"⬆ WP"}
                              </button>
                            )}
                            {hsConfigured&&(
                              <button onClick={()=>uploadToHS(lpHtml,"A")} disabled={hsUploadingA} style={{padding:"4px 10px",borderRadius:5,border:"none",background:"#ff7a59",color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:hsUploadingA?.6:1}}>
                                {hsUploadingA?T("يرفع...","Uploading..."):"⬆ HubSpot"}
                              </button>
                            )}
                            <button onClick={()=>{setLpHtml("");setLpHtmlErr("");setWpResA(null);setHsResA(null);}} style={{padding:"4px 8px",borderRadius:5,border:"1px solid rgba(255,255,255,.1)",background:"none",color:"#6a96aa",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{T("إعادة","Redo")}</button>
                          </div>
                        </div>
                        {wpErrA&&<p style={{padding:"6px 12px",fontSize:10,color:"#f07070"}}>{wpErrA}</p>}
                        {hsErrA&&<p style={{padding:"6px 12px",fontSize:10,color:"#f07070"}}>HubSpot: {hsErrA}</p>}
                        {wpResA&&<div style={{padding:"8px 12px",background:"rgba(33,117,155,.12)",borderBottom:"1px solid rgba(1,53,90,.3)"}}><p style={{fontSize:10,color:"#5dc87a",margin:0}}>✓ WordPress — <a href={wpResA.editUrl} target="_blank" rel="noopener" style={{color:"#17a3a3"}}>{T("افتح في المحرر","Open in editor")}</a></p></div>}
                        {hsResA&&<div style={{padding:"8px 12px",background:"rgba(255,122,89,.08)",borderBottom:"1px solid rgba(255,122,89,.2)"}}><p style={{fontSize:10,color:"#5dc87a",margin:0}}>✓ HubSpot — <a href={hsResA.editUrl} target="_blank" rel="noopener" style={{color:"#ff7a59"}}>{T("افتح في المحرر","Open in editor")}</a></p></div>}
                        <div style={{padding:12}}>
                          <pre style={{background:"#010c1e",border:"1px solid rgba(1,53,90,.6)",borderRadius:8,padding:12,overflowX:"auto",fontSize:9.5,color:"#4dd9b0",maxHeight:220,lineHeight:1.5,direction:"ltr",textAlign:"left",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{lpHtml.slice(0,1400)}{lpHtml.length>1400?"…":""}</pre>
                        </div>
                      </div>
                    )}

                    {/* Variant B */}
                    {lpHtmlBErr&&<ErrBox msg={lpHtmlBErr}/>}
                    {lpHtmlB&&(
                      <div style={card}>
                        <div style={{...cHead,background:"rgba(245,166,35,.06)"}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#f5a623"}}>🅱 Variant B — {T("ثقة وامتثال (A/B Test)","Trust & Compliance (A/B Test)")}</span>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <button onClick={copyLPB} style={{padding:"4px 10px",borderRadius:5,border:"1px solid rgba(245,166,35,.4)",background:"rgba(245,166,35,.1)",color:"#f5a623",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{lpHtmlBCopied?"✓":T("نسخ","Copy")}</button>
                            <button onClick={downloadLPB} style={{padding:"4px 10px",borderRadius:5,border:"none",background:"#f5a623",color:"#021544",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>⬇ HTML</button>
                            <button onClick={()=>uploadToDrive(lpHtmlB,"qoyod-landing-B.html","text/html","lp-b")} disabled={driveLd["lp-b"]} style={{padding:"4px 10px",borderRadius:5,border:"1px solid rgba(66,133,244,.4)",background:"rgba(66,133,244,.1)",color:driveLinks["lp-b"]?"#5dc87a":"#4285f4",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:driveLd["lp-b"]?.6:1}}>
                              {driveLd["lp-b"]?"↑…":driveLinks["lp-b"]?<a href={driveLinks["lp-b"]} target="_blank" rel="noreferrer" style={{color:"#5dc87a",textDecoration:"none"}}>✓ Drive</a>:"☁ Drive"}
                            </button>
                            {(wpConfigured||(wpUrl&&wpUser&&wpPass))&&(
                              <button onClick={()=>uploadToWP(lpHtmlB,"B")} disabled={wpUploadingB} style={{padding:"4px 10px",borderRadius:5,border:"none",background:"#21759b",color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:wpUploadingB?.6:1}}>
                                {wpUploadingB?T("يرفع...","Uploading..."):"⬆ WP"}
                              </button>
                            )}
                            {hsConfigured&&(
                              <button onClick={()=>uploadToHS(lpHtmlB,"B")} disabled={hsUploadingB} style={{padding:"4px 10px",borderRadius:5,border:"none",background:"#ff7a59",color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:hsUploadingB?.6:1}}>
                                {hsUploadingB?T("يرفع...","Uploading..."):"⬆ HubSpot"}
                              </button>
                            )}
                            <button onClick={()=>{setLpHtmlB("");setLpHtmlBErr("");setWpResB(null);setHsResB(null);}} style={{padding:"4px 8px",borderRadius:5,border:"1px solid rgba(255,255,255,.1)",background:"none",color:"#6a96aa",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{T("إعادة","Redo")}</button>
                          </div>
                        </div>
                        {wpErrB&&<p style={{padding:"6px 12px",fontSize:10,color:"#f07070"}}>{wpErrB}</p>}
                        {hsErrB&&<p style={{padding:"6px 12px",fontSize:10,color:"#f07070"}}>HubSpot: {hsErrB}</p>}
                        {wpResB&&<div style={{padding:"8px 12px",background:"rgba(33,117,155,.12)",borderBottom:"1px solid rgba(1,53,90,.3)"}}><p style={{fontSize:10,color:"#5dc87a",margin:0}}>✓ WordPress — <a href={wpResB.editUrl} target="_blank" rel="noopener" style={{color:"#17a3a3"}}>{T("افتح في المحرر","Open in editor")}</a></p></div>}
                        {hsResB&&<div style={{padding:"8px 12px",background:"rgba(255,122,89,.08)",borderBottom:"1px solid rgba(255,122,89,.2)"}}><p style={{fontSize:10,color:"#5dc87a",margin:0}}>✓ HubSpot — <a href={hsResB.editUrl} target="_blank" rel="noopener" style={{color:"#ff7a59"}}>{T("افتح في المحرر","Open in editor")}</a></p></div>}
                        <div style={{padding:12}}>
                          <pre style={{background:"#010c1e",border:"1px solid rgba(1,53,90,.6)",borderRadius:8,padding:12,overflowX:"auto",fontSize:9.5,color:"#f5c842",maxHeight:220,lineHeight:1.5,direction:"ltr",textAlign:"left",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{lpHtmlB.slice(0,1400)}{lpHtmlB.length>1400?"…":""}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab==="library"&&(
          <div className="qa">
            <SH title={T("مكتبة الإعلانات","Ad Library")} sub={T("14 إعلاناً مرجعياً","14 reference ads")}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {CREATIVE_LIBRARY.map(ad=>{
                const fCol=ad.funnel==="TOF"?"#f5a623":ad.funnel==="MOF"?"#17a3a3":"#5dc87a";
                const cCol=ad.category.includes("ZATCA")?"#f07070":ad.category.includes("فاتورة")?"#17a3a3":"#6a96aa";
                return(
                  <div key={ad.id} style={{...card,marginBottom:0}}>
                    <div style={{height:4,background:`linear-gradient(90deg,${cCol},${fCol})`}}/>
                    <div style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8,direction:"rtl"}}><Tag ch={ad.id} style={{fontSize:9,fontWeight:700,color:"#f5a623"}}/><Tag ch={ad.category} style={{fontSize:9,color:cCol}}/><Tag ch={ad.funnel} style={{fontSize:9,color:fCol}}/><Tag ch={ad.format} style={{fontSize:9}}/></div>
                      <p style={{fontSize:13,fontWeight:700,direction:"rtl",textAlign:"right",lineHeight:1.5,marginBottom:6}}>{ad.headline}</p>
                      {ad.sub_top&&<p style={{fontSize:10.5,color:"#5dc87a",direction:"rtl",textAlign:"right",marginBottom:2}}>✓ {ad.sub_top}</p>}
                      {ad.sub_bot&&<p style={{fontSize:10.5,color:"#f07070",direction:"rtl",textAlign:"right",marginBottom:6}}>✗ {ad.sub_bot}</p>}
                      <Btn ch={T("استخدم كمرجع","Use as Reference")} line full onClick={()=>{setBMsg(ad.headline);setBHook(ad.sub_top||"");setBCta(ad.cta||"");setTab("brief");}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="icp"&&(
          <div className="qa">
            <SH title={T("شرائح العملاء","Customer Profiles")} sub={T(`${ICP_PERSONAS.length+customPersonas.length} شرائح`,`${ICP_PERSONAS.length+customPersonas.length} personas`)}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
              {[...ICP_PERSONAS,...customPersonas].map((p,idx)=>{
                const tCol=p.tier==="A"?"#17a3a3":"#f5a623";
                const isCustom=idx>=ICP_PERSONAS.length;
                return(
                  <div key={p.id||idx} style={{...card,marginBottom:0,border:isCustom?"1.5px solid rgba(245,166,35,.25)":"1px solid rgba(1,53,90,.45)"}}>
                    <div style={{...cHead,background:`${tCol}08`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{p.icon||"👤"}</span><div><div style={{fontSize:12,fontWeight:700}}>{p.title}</div><div style={{fontSize:9.5,color:"#6a96aa"}}>{p.en||p.title}</div></div></div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <Tag ch={`Tier ${p.tier}`} style={{fontSize:9.5,color:tCol,fontWeight:700}}/>
                        {isCustom&&<button onClick={()=>setCustomPersonas(prev=>prev.filter((_,i)=>i!==idx-ICP_PERSONAS.length))} style={{background:"none",border:"none",color:"#f07070",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
                      </div>
                    </div>
                    <div style={{padding:"12px 14px"}}>
                      <p style={{fontSize:11.5,direction:"rtl",textAlign:"right",lineHeight:1.7,marginBottom:8}}>{p.pain_ar}</p>
                      <div style={{marginBottom:10,padding:"8px 10px",background:"rgba(245,166,35,.05)",borderRadius:6,borderRight:"2px solid #f5a623"}}><p style={{fontSize:12.5,fontWeight:600,color:"#f5a623",direction:"rtl"}}>{p.hook_ar}</p></div>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>{setExtraNote(`الجمهور: ${p.title} — ${p.pain_ar}`);setFunnel(p.funnel);setTab("content");}} style={{flex:1,padding:"7px 4px",borderRadius:6,border:"1px solid rgba(23,163,164,.35)",background:"rgba(23,163,164,.08)",color:"#17a3a3",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{T("نسخة إعلان","Ad Copy")}</button>
                        <button onClick={()=>{setBMsg(p.hook_ar||"");setBHook(p.hook_ar||"");setBCta(p.cta_ar||"ابدأ الآن");setTab("brief");}} style={{flex:1,padding:"7px 4px",borderRadius:6,border:"1px solid rgba(245,166,35,.35)",background:"rgba(245,166,35,.08)",color:"#f5a623",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{T("استوديو تصميم","Design Studio")}</button>
                        <button onClick={()=>{setExtraNote(`الجمهور: ${p.title} — ${p.pain_ar}`);setFunnel(p.funnel);setBMsg(p.hook_ar||"");setBHook(p.hook_ar||"");setBCta(p.cta_ar||"ابدأ الآن");setTab("content");}} style={{flex:1,padding:"7px 4px",borderRadius:6,border:"1px solid rgba(93,200,122,.35)",background:"rgba(93,200,122,.08)",color:"#5dc87a",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{T("الاثنين معاً","Both")}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{...card,marginBottom:0,border:"1.5px dashed rgba(1,53,90,.4)",cursor:"pointer"}} onClick={()=>setShowAddPersona(p=>!p)}>
                <div style={{padding:"20px 14px",textAlign:"center",color:"#2e5468"}}>
                  <div style={{fontSize:24,marginBottom:6}}>+</div>
                  <div style={{fontSize:11.5,fontWeight:600}}>{T("أضف شريحة عميل","Add Custom Persona")}</div>
                </div>
              </div>
            </div>
            {showAddPersona&&(
              <div style={{...card,marginTop:12}}>
                <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#f5a623"}}>{T("شريحة عميل جديدة","New Persona")}</span></div>
                <div style={cBody}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <Fld label={T("المسمى الوظيفي (عربي)","Role (Arabic)")}><input value={newPersona.title} onChange={e=>setNewPersona(p=>({...p,title:e.target.value}))} placeholder={T("مثال: مدير التسويق","e.g. مدير التسويق")} dir="rtl"/></Fld>
                    <Fld label={T("المسمى (إنجليزي)","Role (English)")}><input value={newPersona.en} onChange={e=>setNewPersona(p=>({...p,en:e.target.value}))} placeholder="e.g. Marketing Manager"/></Fld>
                  </div>
                  <Fld label={T("المشكلة / نقطة الألم","Pain Point")}><textarea value={newPersona.pain_ar} onChange={e=>setNewPersona(p=>({...p,pain_ar:e.target.value}))} rows={2} dir="rtl" style={{textAlign:"right"}} placeholder={T("ما الذي يؤرقه؟","What is their pain?")}/></Fld>
                  <Fld label={T("الهوك الإعلاني","Hook")}><input value={newPersona.hook_ar} onChange={e=>setNewPersona(p=>({...p,hook_ar:e.target.value}))} placeholder={T("الرسالة الأقوى لهذا الجمهور","The strongest message for this audience")} dir="rtl"/></Fld>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <Fld label="Tier"><div style={{display:"flex",gap:4}}>{["A","B"].map(t=><Seg key={t} ch={`Tier ${t}`} on={newPersona.tier===t} onClick={()=>setNewPersona(p=>({...p,tier:t}))}/>)}</div></Fld>
                    <Fld label={T("مرحلة القمع","Funnel")}><div style={{display:"flex",gap:4}}>{["TOF","MOF","BOF"].map(f=><Seg key={f} ch={f} on={newPersona.funnel===f} onClick={()=>setNewPersona(p=>({...p,funnel:f}))}/>)}</div></Fld>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    <Btn ch={T("حفظ الشريحة","Save Persona")} gold onClick={()=>{if(!newPersona.title||!newPersona.pain_ar)return;const id=`CP${customPersonas.length+1}`;setCustomPersonas(prev=>[...prev,{...newPersona,id}]);setNewPersona({title:"",en:"",icon:"👤",tier:"A",pain_ar:"",hook_ar:"",funnel:"TOF",channels:[]});setShowAddPersona(false);}} full/>
                    <Btn ch={T("إلغاء","Cancel")} line onClick={()=>setShowAddPersona(false)} full/>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            A/B VARIANTS
        ══════════════════════════════════════════════════ */}
        {tab==="abtest"&&(
          <div className="qa">
            <SH title={T("توليد نسختين A/B","A/B Copy Variants")} sub={T("نسختان بزاوية مختلفة — أيهما يُحوّل أكثر؟","Two different angles — which one converts better?")}/>
            <ErrBox msg={abErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("إعدادات الاختبار","Test Settings")}</span></div>
              <div style={cBody}>
                <Fld label={T("المنتج","Product")}><GroupedProductPicker selected={abProd} onSelect={setAbProd} lang={lang}/></Fld>
                <Fld label={T("الفكرة أو الرسالة الأساسية","Core concept or message")}>
                  <textarea value={abConcept} onChange={e=>setAbConcept(e.target.value)} rows={3} dir="rtl" style={{textAlign:"right"}} placeholder={T("مثال: قيود يوفر عليك توظيف محاسب كامل","e.g. Qoyod saves you a full-time accountant cost")}/>
                </Fld>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <Fld label={T("القناة","Channel")}><select value={abChan} onChange={e=>setAbChan(e.target.value)}>{["Instagram","TikTok","Snapchat","Meta","Google","LinkedIn"].map(c=><option key={c}>{c}</option>)}</select></Fld>
                  <Fld label={T("الصيغة","Format")}><select value={abFmt} onChange={e=>setAbFmt(e.target.value)}>{["Static","Reel","Story","Carousel","Video"].map(f=><option key={f}>{f}</option>)}</select></Fld>
                  <Fld label={T("مرحلة الجمهور","Funnel Stage")}><select value={abAud} onChange={e=>setAbAud(e.target.value)}>{["TOF","MOF","BOF"].map(s=><option key={s}>{s}</option>)}</select></Fld>
                </div>
                <Btn ch={abLd?T("يولّد...","Generating..."):`${T("ولّد نسختين","Generate A/B Variants")}`} gold={!abLd} onClick={genAB} dis={abLd} full/>
              </div>
            </div>
            {abLd&&<Loader msg={T("يكتب نسختين بزاوية مختلفة...","Writing two different angles...")}/>}
            {abRes&&!abLd&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                  {["variant_a","variant_b"].map(key=>{
                    const v=abRes[key];if(!v)return null;
                    const isA=key==="variant_a";
                    const accent=isA?"#17a3a3":"#f59e0b";
                    return(
                      <div key={key} style={{...card,marginBottom:0,border:`1.5px solid ${accent}30`}}>
                        <div style={{...cHead,background:`${accent}08`,borderBottom:`1px solid ${accent}20`}}>
                          <span style={{fontSize:12,fontWeight:700,color:accent}}>{v.label||key}</span>
                          <Tag ch={`CTR: ${v.predicted_ctr}`} style={{fontSize:9,background:`${accent}15`,color:accent,border:`1px solid ${accent}30`}}/>
                        </div>
                        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{padding:"8px 10px",background:"rgba(23,163,164,.05)",borderRadius:6,direction:"rtl"}}>
                            <p style={{fontSize:9,color:"#6a96aa",marginBottom:3}}>{T("الهوك","Hook")}</p>
                            <p style={{fontSize:13,fontWeight:700,color:"#ddeef4"}}>{v.hook}</p>
                          </div>
                          <div style={{direction:"rtl"}}>
                            <p style={{fontSize:9,color:"#6a96aa",marginBottom:2}}>{T("الهيدلاين","Headline")}</p>
                            <p style={{fontSize:12,fontWeight:600}}>{v.headline}</p>
                          </div>
                          <div style={{direction:"rtl"}}>
                            <p style={{fontSize:9,color:"#6a96aa",marginBottom:2}}>{T("البودي","Body")}</p>
                            <p style={{fontSize:11.5,lineHeight:1.7}}>{v.body}</p>
                          </div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            <Tag ch={`CTA: ${v.cta}`} style={{fontSize:9.5,background:`${accent}12`,color:accent}}/>
                            <Tag ch={v.hook_type} style={{fontSize:9.5}}/>
                            <Tag ch={v.emotional_trigger} style={{fontSize:9.5}}/>
                          </div>
                          <p style={{fontSize:10.5,color:"#5dc87a",direction:"rtl"}}>{v.why}</p>
                          <Btn ch={T("نسخ","Copy")} line onClick={()=>copyText(`${v.hook}\n\n${v.body}\n\n${v.cta}`)} full/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(abRes.recommendation||abRes.testing_note)&&(
                  <div style={{...card,marginTop:10}}>
                    <div style={cBody}>
                      {abRes.recommendation&&<Row label={T("التوصية","Recommendation")} val={abRes.recommendation}/>}
                      {abRes.testing_note&&<Row label={T("ملاحظة الاختبار","Testing Note")} val={abRes.testing_note}/>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            CONTENT CALENDAR
        ══════════════════════════════════════════════════ */}
        {tab==="calendar"&&(
          <div className="qa">
            <SH title={T("خطة المحتوى الشهرية","Monthly Content Calendar")} sub={T("خطة نشر كاملة بالمنصة والفكرة والكابشن","Full posting plan with platform, topic and caption")}/>
            <ErrBox msg={calErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("إعدادات الخطة","Plan Settings")}</span></div>
              <div style={cBody}>
                <Fld label={T("المنتج","Product")}><GroupedProductPicker selected={calProd} onSelect={setCalProd} lang={lang}/></Fld>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Fld label={T("الشهر / الفترة","Month / Period")}><input value={calMonth} onChange={e=>setCalMonth(e.target.value)} placeholder="مايو 2025"/></Fld>
                  <Fld label={T("هدف الخطة","Goal")}><input value={calGoal} onChange={e=>setCalGoal(e.target.value)} placeholder="Awareness + Leads"/></Fld>
                </div>
                <Fld label={T("تكرار النشر","Posting Frequency")}>
                  <select value={calFreq} onChange={e=>setCalFreq(e.target.value)}>
                    {["daily","5 posts/week","4 posts/week","3 posts/week","2 posts/week","1 post/week"].map(f=><option key={f}>{f}</option>)}
                  </select>
                </Fld>
                <Fld label={T("المنصات","Platforms")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
                    {["Instagram","TikTok","Snapchat","X (Twitter)","LinkedIn","YouTube Shorts"].map(p=>{
                      const on=calPlatforms.includes(p);
                      return <button key={p} onClick={()=>setCalPlatforms(pr=>on?pr.filter(x=>x!==p):[...pr,p])} style={{padding:"3px 9px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:on?700:400,border:`1px solid ${on?"rgba(23,163,164,.7)":"rgba(1,53,90,.35)"}`,background:on?"rgba(23,163,164,.15)":"#0a1f3d",color:on?"#17a3a3":"#5a8090",transition:"all .12s"}}>{p}</button>;
                    })}
                  </div>
                </Fld>
                <Btn ch={calLd?T("يبني الخطة...","Building plan..."):`${T("أنشئ الخطة","Generate Calendar")}`} gold={!calLd} onClick={genCalendar} dis={calLd} full/>
              </div>
            </div>
            {calLd&&<Loader msg={T("يبني خطة محتوى شهرية...","Building monthly content plan...")}/>}
            {calRes&&!calLd&&(
              <>
                <div style={{...card,marginTop:10}}>
                  <div style={cHead}>
                    <span style={{fontSize:12,fontWeight:700}}>{calRes.month}</span>
                    <div style={{display:"flex",gap:6}}>
                      <Tag ch={`${calRes.total_posts} posts`}/>
                      <Tag ch={calRes.goal||calGoal}/>
                    </div>
                  </div>
                  <div style={{padding:"10px 14px",display:"flex",gap:6,flexWrap:"wrap"}}>
                    {(calRes.themes||[]).map((t,i)=><Tag key={i} ch={t} style={{fontSize:10.5,background:"rgba(23,163,164,.1)",color:"#17a3a3"}}/>)}
                  </div>
                </div>
                {(calRes.weeks||[]).map(w=>(
                  <div key={w.week} style={{...card,marginTop:10}}>
                    <div style={cHead}><span style={{fontSize:11.5,fontWeight:700}}>{T(`الأسبوع ${w.week}`,`Week ${w.week}`)}</span><Tag ch={`${(w.posts||[]).length} posts`}/></div>
                    <div style={{padding:"0 14px 12px"}}>
                      {(w.posts||[]).map((post,i)=>(
                        <div key={i} style={{padding:"12px 0",borderBottom:"1px solid rgba(1,53,90,.3)"}}>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                            <Tag ch={post.day} style={{background:"rgba(23,163,164,.1)",color:"#17a3a3"}}/>
                            <Tag ch={post.platform}/>
                            <Tag ch={post.format}/>
                            <Tag ch={post.funnel_stage} style={{background:post.funnel_stage==="TOF"?"rgba(96,165,250,.1)":post.funnel_stage==="MOF"?"rgba(245,158,11,.1)":"rgba(16,185,129,.1)",color:post.funnel_stage==="TOF"?"#60a5fa":post.funnel_stage==="MOF"?"#f59e0b":"#10b981"}}/>
                          </div>
                          <p style={{fontSize:12.5,fontWeight:700,color:"#ddeef4",direction:"rtl",marginBottom:4}}>{post.design_text}</p>
                          <p style={{fontSize:11.5,color:"#6a96aa",direction:"rtl",marginBottom:6,lineHeight:1.6}}>{post.caption}</p>
                          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:9.5,color:"#2e5468"}}>{post.hashtags}</span>
                            <Tag ch={`CTA: ${post.cta}`} style={{fontSize:9.5,color:"#f59e0b",background:"rgba(245,158,11,.08)"}}/>
                            <Btn ch={T("نسخ","Copy")} line onClick={()=>copyText(`${post.design_text}\n\n${post.caption}\n\n${post.hashtags}`)}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {calRes.hashtag_sets&&(
                  <div style={{...card,marginTop:10}}>
                    <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("مجموعات الهاشتاق","Hashtag Sets")}</span></div>
                    <div style={cBody}>
                      <Row label={T("رئيسي","Main")} val={calRes.hashtag_sets.main}/>
                      <Row label={T("ثانوي","Secondary")} val={calRes.hashtag_sets.secondary}/>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            EMAIL / WA SEQUENCES
        ══════════════════════════════════════════════════ */}
        {tab==="email"&&(
          <div className="qa">
            <SH title={T("رسائل التسويق التسلسلي","Email & WhatsApp Sequences")} sub={T("سلسلة رسائل لكل مرحلة من رحلة العميل","Message sequences for every stage of the customer journey")}/>
            <ErrBox msg={seqErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("إعدادات السلسلة","Sequence Settings")}</span></div>
              <div style={cBody}>
                <Fld label={T("المنتج","Product")}><GroupedProductPicker selected={seqProd} onSelect={setSeqProd} lang={lang}/></Fld>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Fld label={T("نوع السلسلة","Sequence Type")}>
                    <select value={seqType} onChange={e=>setSeqType(e.target.value)}>
                      <option value="welcome">{T("ترحيب — مستخدم جديد","Welcome — New User")}</option>
                      <option value="nurture">{T("تأهيل — عميل محتمل","Nurture — Warm Lead")}</option>
                      <option value="winback">{T("استعادة — عميل انقطع","Win-back — Lapsed User")}</option>
                      <option value="demo">{T("متابعة بعد الديمو","Post-Demo Follow-up")}</option>
                      <option value="announcement">{T("إعلان ميزة جديدة","Feature Announcement")}</option>
                    </select>
                  </Fld>
                  <Fld label={T("القناة","Channel")}>
                    <select value={seqChannel} onChange={e=>setSeqChannel(e.target.value)}>
                      <option value="email">{T("بريد إلكتروني","Email")}</option>
                      <option value="whatsapp">{T("واتساب","WhatsApp")}</option>
                      <option value="sms">SMS</option>
                    </select>
                  </Fld>
                </div>
                <Fld label={T(`عدد الرسائل (${seqSteps})`,`Number of messages (${seqSteps})`)}>
                  <input type="range" min={2} max={6} value={seqSteps} onChange={e=>setSeqSteps(Number(e.target.value))} style={{padding:"8px 0",background:"none",border:"none",cursor:"pointer"}}/>
                </Fld>
                <Btn ch={seqLd?T("يكتب السلسلة...","Writing sequence..."):`${T("ولّد السلسلة","Generate Sequence")}`} gold={!seqLd} onClick={genSeq} dis={seqLd} full/>
              </div>
            </div>
            {seqLd&&<Loader msg={T("يكتب السلسلة...","Writing the sequence...")}/>}
            {seqRes&&!seqLd&&(
              <>
                <div style={{...card,marginTop:10}}>
                  <div style={cHead}>
                    <span style={{fontSize:12,fontWeight:700}}>{seqRes.sequence_name}</span>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <Tag ch={seqRes.channel}/><Tag ch={seqRes.type}/>
                      <button onClick={()=>uploadToDrive((seqRes.messages||[]).map((m,i)=>`[${T("رسالة","Message")} ${m.step}] ${m.send_timing||""}\n${T("الموضوع","Subject")}: ${m.subject||""}\n\n${m.body||m.content||""}\n\n${"─".repeat(40)}`).join("\n\n"),"qoyod-email-sequence.txt","text/plain","seq")} disabled={driveLd["seq"]} style={{padding:"3px 8px",borderRadius:4,border:"1px solid rgba(66,133,244,.4)",background:"rgba(66,133,244,.1)",color:driveLinks["seq"]?"#5dc87a":"#4285f4",fontSize:9.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600,opacity:driveLd["seq"]?.6:1}}>
                        {driveLd["seq"]?"↑…":driveLinks["seq"]?<a href={driveLinks["seq"]} target="_blank" rel="noreferrer" style={{color:"#5dc87a",textDecoration:"none"}}>✓ Drive</a>:"☁ Drive"}
                      </button>
                    </div>
                  </div>
                </div>
                {(seqRes.messages||[]).map((msg,i)=>(
                  <div key={i} style={{...card,marginTop:8}}>
                    <div style={{...cHead,background:"rgba(23,163,164,.05)"}}>
                      <span style={{fontSize:11.5,fontWeight:700,color:"#17a3a3"}}>{T(`رسالة ${msg.step}`,`Message ${msg.step}`)}</span>
                      <div style={{display:"flex",gap:6}}>
                        <Tag ch={msg.send_timing} style={{fontSize:9.5,color:"#f59e0b",background:"rgba(245,158,11,.08)"}}/>
                        <Tag ch={msg.tone||""} style={{fontSize:9.5}}/>
                      </div>
                    </div>
                    <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:6}}>
                      {msg.subject&&<Row label={T("الموضوع","Subject")} val={msg.subject}/>}
                      {msg.preview_text&&<Row label={T("نص المعاينة","Preview Text")} val={msg.preview_text}/>}
                      <div style={{padding:"10px 12px",background:"rgba(7,22,48,.6)",borderRadius:6,direction:"rtl",lineHeight:1.8}}>
                        <p style={{fontSize:12,color:"#ddeef4"}}>{msg.body}</p>
                      </div>
                      {msg.cta&&<Row label="CTA" val={msg.cta}/>}
                      {msg.goal&&<p style={{fontSize:10,color:"#5dc87a",direction:"rtl"}}>{T("الهدف: ","Goal: ")}{msg.goal}</p>}
                      <Btn ch={T("نسخ الرسالة","Copy Message")} line onClick={()=>copyText(`${msg.subject?`Subject: ${msg.subject}\n`:""}${msg.body}\n\n${msg.cta||""}`)} full/>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}


        {/* ══════════════════════════════════════════════════
            AD SPEC SHEET
        ══════════════════════════════════════════════════ */}
        {tab==="adspec"&&(
          <div className="qa">
            <SH title={T("مواصفات الإعلان","Ad Spec Sheet")} sub={T("الأبعاد والقيود لكل منصة — مرجع جاهز للمصمم","Dimensions and limits per platform — ready reference for the designer")}/>
            <ErrBox msg={specErr}/>
            <div style={card}>
              <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("إعدادات","Settings")}</span></div>
              <div style={cBody}>
                <Fld label={T("المنتج","Product")}><GroupedProductPicker selected={specProd} onSelect={setSpecProd} lang={lang}/></Fld>
                <Fld label={T("الهدف التسويقي","Campaign Goal")}><select value={specGoal} onChange={e=>setSpecGoal(e.target.value)}>{["Leads","Awareness","Sales","App Installs","Traffic"].map(g=><option key={g}>{g}</option>)}</select></Fld>
                <Fld label={T("المنصات","Platforms")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
                    {["Meta","TikTok","Snapchat","Google","LinkedIn","X (Twitter)","YouTube"].map(p=>{
                      const on=specPlatforms.includes(p);
                      return <button key={p} onClick={()=>setSpecPlatforms(pr=>on?pr.filter(x=>x!==p):[...pr,p])} style={{padding:"3px 9px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:on?700:400,border:`1px solid ${on?"rgba(23,163,164,.7)":"rgba(1,53,90,.35)"}`,background:on?"rgba(23,163,164,.15)":"#0a1f3d",color:on?"#17a3a3":"#5a8090",transition:"all .12s"}}>{p}</button>;
                    })}
                  </div>
                </Fld>
                <Btn ch={specLd?T("يجهّز المواصفات...","Generating specs..."):`${T("أنشئ مواصفات الإعلان","Generate Ad Specs")}`} gold={!specLd} onClick={genSpec} dis={specLd} full/>
              </div>
            </div>
            {specLd&&<Loader msg={T("يجهّز مواصفات لكل منصة...","Generating specs for each platform...")}/>}
            {specRes&&!specLd&&(
              <>
                {specRes.brand_quick_ref&&(
                  <div style={{...card,marginTop:10}}>
                    <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("الهوية البصرية السريعة","Brand Quick Ref")}</span></div>
                    <div style={cBody}>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:5,background:"#021544",border:"1px solid rgba(255,255,255,.1)"}}><div style={{width:12,height:12,borderRadius:2,background:"#021544",border:"1px solid #fff"}}><span style={{fontSize:0}}>.</span></div><span style={{fontSize:10,color:"#fff"}}>Navy #021544</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:5,background:"rgba(23,163,164,.15)",border:"1px solid rgba(23,163,164,.3)"}}><div style={{width:12,height:12,borderRadius:2,background:"#17A3A4"}}><span style={{fontSize:0}}>.</span></div><span style={{fontSize:10,color:"#17a3a3"}}>Teal #17A3A4</span></div>
                      </div>
                      <Row label={T("الخط","Font")} val={specRes.brand_quick_ref.font}/>
                      <Row label={T("موضع الشعار","Logo Placement")} val={specRes.brand_quick_ref.logo_placement}/>
                      <Row label={T("أسلوب الصوت","Tone")} val={specRes.brand_quick_ref.tone}/>
                    </div>
                  </div>
                )}
                {(specRes.platforms||[]).map(plat=>(
                  <div key={plat.platform} style={{...card,marginTop:10}}>
                    <div style={cHead}><span style={{fontSize:12,fontWeight:700,color:"#17a3a3"}}>{plat.platform}</span></div>
                    <div style={{padding:"0 14px 12px"}}>
                      {(plat.formats||[]).map((fmt,i)=>(
                        <div key={i} style={{padding:"12px 0",borderBottom:"1px solid rgba(1,53,90,.25)"}}>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                            <Tag ch={fmt.format} style={{fontWeight:700,color:"#17a3a3",background:"rgba(23,163,164,.1)"}}/>
                            <Tag ch={fmt.dimensions||fmt.aspect_ratio}/>
                            {fmt.duration&&<Tag ch={fmt.duration}/>}
                            {fmt.max_file_size&&<Tag ch={fmt.max_file_size}/>}
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
                            {fmt.headline_chars&&<p style={{fontSize:10.5,color:"#6a96aa"}}>{T("هيدلاين: ","Headline: ")}<span style={{color:"#ddeef4",fontWeight:600}}>{fmt.headline_chars}</span></p>}
                            {fmt.body_chars&&<p style={{fontSize:10.5,color:"#6a96aa"}}>{T("نص: ","Body: ")}<span style={{color:"#ddeef4",fontWeight:600}}>{fmt.body_chars}</span></p>}
                            {fmt.text_limit&&<p style={{fontSize:10.5,color:"#6a96aa"}}>{T("حد النص: ","Text limit: ")}<span style={{color:"#ddeef4",fontWeight:600}}>{fmt.text_limit}</span></p>}
                            {fmt.safe_zone&&<p style={{fontSize:10.5,color:"#6a96aa"}}>{T("منطقة آمنة: ","Safe zone: ")}<span style={{color:"#ddeef4",fontWeight:600}}>{fmt.safe_zone}</span></p>}
                          </div>
                          <p style={{fontSize:11.5,direction:"rtl",color:"#ddeef4",marginBottom:4}}>{fmt.creative_direction}</p>
                          {fmt.dos?.length>0&&<p style={{fontSize:10.5,color:"#5dc87a",direction:"rtl"}}>{T("يجب: ","Do: ")}{fmt.dos.join(" · ")}</p>}
                          {fmt.donts?.length>0&&<p style={{fontSize:10.5,color:"#f07070",direction:"rtl"}}>{T("تجنب: ","Don't: ")}{fmt.donts.join(" · ")}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(specRes.global_dos?.length>0||specRes.global_donts?.length>0)&&(
                  <div style={{...card,marginTop:10}}>
                    <div style={cHead}><span style={{fontSize:11,fontWeight:600,color:"#6a96aa"}}>{T("قواعد عامة","Global Rules")}</span></div>
                    <div style={cBody}>
                      {specRes.global_dos?.length>0&&<div style={{marginBottom:8}}><p style={{fontSize:10,color:"#5dc87a",marginBottom:4}}>{T("يجب دائماً","Always do")}</p>{specRes.global_dos.map((d,i)=><p key={i} style={{fontSize:11.5,direction:"rtl",padding:"3px 0",color:"#ddeef4"}}>{d}</p>)}</div>}
                      {specRes.global_donts?.length>0&&<div><p style={{fontSize:10,color:"#f07070",marginBottom:4}}>{T("تجنب دائماً","Never do")}</p>{specRes.global_donts.map((d,i)=><p key={i} style={{fontSize:11.5,direction:"rtl",padding:"3px 0",color:"#ddeef4"}}>{d}</p>)}</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
