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
  console.log('🚀 Starting Firestore sync using Admin SDK...');

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
        "Không có gì quý hơn độc lập, tự do. - Hồ Chí Minh",
        "Vì lợi ích mười năm thì phải trồng cây, vì lợi ích trăm năm thì phải trồng người. - Hồ Chí Minh",
        "Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công. - Hồ Chí Minh",
        "Dễ mười lần không dân cũng chịu, khó trăm lần dân liệu cũng xong. - Hồ Chí Minh",
        "Có tài mà không có đức là người vô dụng, có đức mà không có tài thì làm việc gì cũng khó. - Hồ Chí Minh",
        "Học hỏi là việc phải tiếp tục suốt đời. - Hồ Chí Minh",
        "Cần, Kiệm, Liêm, Chính, Chí công vô tư. - Hồ Chí Minh",
        "Nước Việt Nam là một, dân tộc Việt Nam là một. - Hồ Chí Minh",
        "Mỗi người tốt, mỗi việc tốt là một bông hoa đẹp, cả dân tộc ta là một rừng hoa đẹp. - Hồ Chí Minh",
        "Tôi chỉ có một sự ham muốn, ham muốn tột bậc, là làm sao cho nước ta được độc lập toàn diện. - Hồ Chí Minh"
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
  console.log('✅ Synchronized site_config/main_config (15 apps, 10 quotes, 5 socials)');

  // 2. Clean filmstrip images
  await db.collection('system').doc('memories').set({ filmStripImages: [] }, { merge: true });
  console.log('✅ Synchronized system/memories (cleaned film images)');

  // 3. Project E-Ink
  const projectData = {
    id: 'aesl0213-eink-ble',
    title: 'AESL0213 E-Ink BLE',
    category: 'IoT / Web Bluetooth',
    tags: ['Web BLE', 'E-Ink 122x250', 'nRF52811', 'Floyd-Steinberg'],
    description: 'Ứng dụng web điều khiển và nạp ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử AESL0213 qua giao thức Bluetooth Low Energy (Web BLE).',
    demoUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
    githubUrl: 'https://github.com/BCToiws0902/sent_pic_to_eink',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
    order: 1,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('aesl0213-eink-ble').set(projectData, { merge: true });
  console.log('✅ Synchronized project AESL0213 E-Ink BLE with demo & github URLs');

  // 4. Project BCTweaksRepo
  const project2Data = {
    id: 'bctweaks-repo',
    title: 'BCTweaksRepo',
    category: 'iOS Jailbreak / APT Repository',
    tags: ['iOS Jailbreak', 'Cydia / Sileo', 'APT Repo', 'Debian Packages', 'iOS 12+'],
    description: 'Kho lưu trữ (Repository) tinh chỉnh và Tweak iOS dành cho các thiết bị Jailbreak (iOS 12+), tích hợp sẵn các gói .deb tối ưu hóa hệ thống, giao diện và chức năng cho Cydia, Sileo, Zebra.',
    demoUrl: 'https://bctoiws0902.github.io/tweak_for_ios12/',
    githubUrl: 'https://github.com/BCToiws0902/tweak_for_ios12',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    order: 2,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('bctweaks-repo').set(project2Data, { merge: true });
  console.log('✅ Synchronized project BCTweaksRepo with repo & github URLs');

  console.log('🎉 All Firestore data successfully synchronized!');
}

syncAll().then(() => process.exit(0)).catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
