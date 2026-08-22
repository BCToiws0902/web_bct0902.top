import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service Account file not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncAll() {
  console.log('ðŸš€ Starting Firestore sync using Admin SDK...');

  // 1. Main Config
  const mainConfigData = {
    appearance: {
      theme: 'dark',
      logoUrl: '/logobct.png',
      backgroundBlur: true,
      particleEffects: true,
      gridOverlay: false
    },
    social_links: [
      { name: 'Facebook', icon: 'Facebook', url: 'https://facebook.com/bct0902', color: '#1877F2', isVisible: true },
      { name: 'Github', icon: 'Github', url: 'https://github.com/bct0902', color: '#ffffff', isVisible: true },
      { name: 'Youtube', icon: 'Youtube', url: 'https://youtube.com/@bct0902', color: '#FF0000', isVisible: true },
      { name: 'LinkedIn', icon: 'LinkedIn', url: 'https://linkedin.com/in/bct0902', color: '#0A66C2', isVisible: true },
      { name: 'Messenger', icon: 'MessageSquare', url: 'https://m.me/bct0902', color: '#0084FF', isVisible: true }
    ],
    content: {
      quotes: [
        "KhÃ´ng cÃ³ gÃ¬ quÃ½ hÆ¡n Ä‘á»™c láº­p, tá»± do. - Há»“ ChÃ­ Minh",
        "VÃ¬ lá»£i Ã­ch mÆ°á»i nÄƒm thÃ¬ pháº£i trá»“ng cÃ¢y, vÃ¬ lá»£i Ã­ch trÄƒm nÄƒm thÃ¬ pháº£i trá»“ng ngÆ°á»i. - Há»“ ChÃ­ Minh",
        "ÄoÃ n káº¿t, Ä‘oÃ n káº¿t, Ä‘áº¡i Ä‘oÃ n káº¿t. ThÃ nh cÃ´ng, thÃ nh cÃ´ng, Ä‘áº¡i thÃ nh cÃ´ng. - Há»“ ChÃ­ Minh",
        "Dá»… mÆ°á»i láº§n khÃ´ng dÃ¢n cÅ©ng chá»‹u, khÃ³ trÄƒm láº§n dÃ¢n liá»‡u cÅ©ng xong. - Há»“ ChÃ­ Minh",
        "CÃ³ tÃ i mÃ  khÃ´ng cÃ³ Ä‘á»©c lÃ  ngÆ°á»i vÃ´ dá»¥ng, cÃ³ Ä‘á»©c mÃ  khÃ´ng cÃ³ tÃ i thÃ¬ lÃ m viá»‡c gÃ¬ cÅ©ng khÃ³. - Há»“ ChÃ­ Minh",
        "Há»c há»i lÃ  viá»‡c pháº£i tiáº¿p tá»¥c suá»‘t Ä‘á»i. - Há»“ ChÃ­ Minh",
        "Cáº§n, Kiá»‡m, LiÃªm, ChÃ­nh, ChÃ­ cÃ´ng vÃ´ tÆ°. - Há»“ ChÃ­ Minh",
        "NÆ°á»›c Viá»‡t Nam lÃ  má»™t, dÃ¢n tá»™c Viá»‡t Nam lÃ  má»™t. - Há»“ ChÃ­ Minh",
        "Má»—i ngÆ°á»i tá»‘t, má»—i viá»‡c tá»‘t lÃ  má»™t bÃ´ng hoa Ä‘áº¹p, cáº£ dÃ¢n tá»™c ta lÃ  má»™t rá»«ng hoa Ä‘áº¹p. - Há»“ ChÃ­ Minh",
        "TÃ´i chá»‰ cÃ³ má»™t sá»± ham muá»‘n, ham muá»‘n tá»™t báº­c, lÃ  lÃ m sao cho nÆ°á»›c ta Ä‘Æ°á»£c Ä‘á»™c láº­p toÃ n diá»‡n. - Há»“ ChÃ­ Minh"
      ],
      filmStripSpeed: 45
    },
    apps: [
      { name: "Antigravity", color: "#00d2ff" },
      { name: "Github", color: "#ffffff" },
      { name: "Brave", color: "#fb542b" },
      { name: "Vercel", color: "#ffffff" },
      { name: "iNet", color: "#F26522" },
      { name: "Apple", color: "#ffffff" },
      { name: "Canva", color: "#00c4cc" },
      { name: "Microsoft", color: "#F25022" },
      { name: "Office 365", color: "#D83B01" },
      { name: "Photoshop", color: "#31A8FF" },
      { name: "Linux", color: "#fcc624" },
      { name: "Centos", color: "#22ad2c" },
      { name: "VS Code", color: "#007ACC" },
      { name: "OBS", color: "#ffffff" },
      { name: "VM Ware", color: "#607078" }
    ],
    maintenance: {
      blog: false,
      chronicles: false,
      showcase: false,
      shortener: false,
      quiz: false
    }
  };

  await db.collection('site_config').doc('main_config').set(mainConfigData, { merge: true });
  console.log('âœ… Synchronized site_config/main_config (15 apps, 10 quotes, 5 socials)');

  // 2. Clean filmstrip images
  await db.collection('system').doc('memories').set({ filmStripImages: [] }, { merge: true });
  console.log('âœ… Synchronized system/memories (cleaned film images)');

  // 3. Project E-Ink
  const projectData = {
    id: 'aesl0213-eink-ble',
    title: 'AESL0213 E-Ink BLE',
    category: 'IoT / Web Bluetooth',
    tags: ['Web BLE', 'E-Ink 122x250', 'nRF52811', 'Floyd-Steinberg'],
    description: 'á»¨ng dá»¥ng web Ä‘iá»u khiá»ƒn vÃ  náº¡p áº£nh 3 mÃ u (Äen, Tráº¯ng, Äá») lÃªn mÃ n hÃ¬nh má»±c Ä‘iá»‡n tá»­ AESL0213 qua giao thá»©c Bluetooth Low Energy (Web BLE).',
    demoUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
    githubUrl: 'https://github.com/BCToiws0902/sent_pic_to_eink',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
    order: 1,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('aesl0213-eink-ble').set(projectData, { merge: true });
  console.log('âœ… Synchronized project AESL0213 E-Ink BLE with demo & github URLs');

  // 4. Project BCTweaksRepo
  const project2Data = {
    id: 'bctweaks-repo',
    title: 'BCTweaksRepo',
    category: 'iOS Jailbreak / APT Repository',
    tags: ['iOS Jailbreak', 'Cydia / Sileo', 'APT Repo', 'Debian Packages', 'iOS 12+'],
    description: 'Kho lÆ°u trá»¯ (Repository) tinh chá»‰nh vÃ  Tweak iOS dÃ nh cho cÃ¡c thiáº¿t bá»‹ Jailbreak (iOS 12+), tÃ­ch há»£p sáºµn cÃ¡c gÃ³i .deb tá»‘i Æ°u hÃ³a há»‡ thá»‘ng, giao diá»‡n vÃ  chá»©c nÄƒng cho Cydia, Sileo, Zebra.',
    demoUrl: 'https://bctoiws0902.github.io/tweak_for_ios12/',
    githubUrl: 'https://github.com/BCToiws0902/tweak_for_ios12',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    order: 2,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('bctweaks-repo').set(project2Data, { merge: true });
  console.log('âœ… Synchronized project BCTweaksRepo with repo & github URLs');

  // 5. Project PTZ Controller Portable
  const project3Data = {
    id: 'ptz-controller-portable',
    title: 'PTZ Controller Portable',
    category: 'Camera Tool / Hardware Utility',
    tags: ['PTZ Camera', 'VISCA Serial', '.NET WinForms', 'Always-On-Top', 'Portable App'],
    description: 'á»¨ng dá»¥ng Windows portable Ä‘iá»u khiá»ƒn camera PTZ qua giao thá»©c VISCA Serial (USB COM port), há»— trá»£ bÃ n phÃ­m Ä‘iá»u hÆ°á»›ng 8 hÆ°á»›ng, thu phÃ³ng quang há»c vÃ  cá»­a sá»• Ä‘iá»u khiá»ƒn ná»•i mini Always-On-Top tiá»‡n lá»£i.',
    demoUrl: 'https://github.com/BCToiws0902/PTZ-Controller-Portable',
    githubUrl: 'https://github.com/BCToiws0902/PTZ-Controller-Portable',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    order: 3,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('ptz-controller-portable').set(project3Data, { merge: true });
  console.log('âœ… Synchronized project PTZ Controller Portable with repo & github URLs');

  console.log('ðŸŽ‰ All Firestore data successfully synchronized!');
}

syncAll().then(() => process.exit(0)).catch(err => {
  console.error('âŒ Sync failed:', err);
  process.exit(1);
});
