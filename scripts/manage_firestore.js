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
  console.log('🚀 Starting Firestore sync using Admin SDK with clean UTF-8...');

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
      { name: 'Github', icon: 'Github', url: 'https://github.com/bct0902', color: '#181717', isVisible: true },
      { name: 'Telegram', icon: 'Telegram', url: 'https://t.me/bct0902', color: '#26A5E4', isVisible: true },
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
      { name: "Github", color: "#181717" },
      { name: "Brave", color: "#fb542b" },
      { name: "Vercel", color: "#000000" },
      { name: "iNet", color: "#F26522" },
      { name: "Apple", color: "#000000" },
      { name: "Canva", color: "#00c4cc" },
      { name: "Microsoft", color: "#F25022" },
      { name: "Office 365", color: "#D83B01" },
      { name: "Photoshop", color: "#31A8FF" },
      { name: "Linux", color: "#fcc624" },
      { name: "Centos", color: "#22ad2c" },
      { name: "VS Code", color: "#007ACC" },
      { name: "OBS", color: "#000000" },
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
  console.log('✅ Synchronized site_config/main_config with clean Vietnamese text');

  // 2. Clean filmstrip images
  await db.collection('system').doc('memories').set({ filmStripImages: [] }, { merge: true });

  // 3. Project E-Ink
  const projectData = {
    id: 'aesl0213-eink-ble',
    slug: 'aesl0213-eink-ble',
    title: 'AESL0213 E-Ink BLE',
    category: 'IoT / Web Bluetooth',
    tags: ['Web BLE', 'E-Ink 122x250', 'nRF52811', 'Floyd-Steinberg'],
    description: 'Ứng dụng web điều khiển và nạp ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử AESL0213 qua giao thức Bluetooth Low Energy (Web BLE).',
    shortDescription: 'Ứng dụng web điều khiển và nạp ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử AESL0213 qua giao thức Bluetooth Low Energy (Web BLE).',
    content: `# Giới Thiệu Dự Án AESL0213 E-Ink BLE\n\nỨng dụng nền tảng Web hiện đại giao tiếp trực tiếp với chip vi điều khiển nRF52811 qua công nghệ **Web Bluetooth API**, cho phép truyền tải và hiển thị hình ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử E-Paper AESL0213.\n\n### Tính Năng Nổi Bật\n- **Không cần cài đặt ứng dụng:** Hoạt động trực tiếp trên trình duyệt Chrome, Edge, Brave có hỗ trợ Web BLE.\n- **Thuật toán hòa sắc (Floyd-Steinberg Dithering):** Tối ưu hóa ảnh màu chuyển đổi sang 3 kênh màu sắc nét.\n- **Tối ưu truyền gói BLE (Chunk Transmission):** Chia nhỏ dữ liệu bitmap truyền tải mượt mà, không nghẽn băng thông.`,
    demoUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
    githubUrl: 'https://github.com/BCToiws0902/sent_pic_to_eink',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    actionButtonLabel: 'TRUY CẬP ỨNG DỤNG WEB',
    platform: 'Web Browser (Web BLE)',
    version: 'v1.0.0',
    fileSize: 'Trực tuyến',
    order: 1,
    featured: true,
    published: true,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('aesl0213-eink-ble').set(projectData, { merge: true });
  console.log('✅ Synchronized project AESL0213 E-Ink BLE (Clean Vietnamese)');

  // 4. Project BCTweaksRepo
  const project2Data = {
    id: 'bctweaks-repo',
    slug: 'bctweaks-repo',
    title: 'BCTweaksRepo',
    category: 'iOS Jailbreak / APT Repository',
    tags: ['iOS Jailbreak', 'Cydia / Sileo', 'APT Repo', 'Debian Packages', 'iOS 12+'],
    description: 'Kho lưu trữ (Repository) tinh chỉnh và Tweak iOS dành cho các thiết bị Jailbreak (iOS 12+), tích hợp sẵn các gói .deb tối ưu hóa hệ thống, giao diện và chức năng cho Cydia, Sileo, Zebra.',
    shortDescription: 'Kho lưu trữ (Repository) tinh chỉnh và Tweak iOS dành cho các thiết bị Jailbreak (iOS 12+), tích hợp sẵn các gói .deb tối ưu hóa hệ thống, giao diện và chức năng cho Cydia, Sileo, Zebra.',
    content: `# Giới Thiệu BCTweaksRepo\n\nKho lưu trữ (APT Repository) chính thức cung cấp các gói tinh chỉnh (Tweaks) và tiện ích dành cho các thiết bị iPhone/iPad đã Jailbreak chạy iOS 12 trở lên.\n\n### Điểm Nổi Bật\n- **Tương thích cao:** Hỗ trợ đầy đủ các trình quản lý gói phổ biến như Cydia, Sileo, Zebra, Installer.\n- **Tối ưu hiệu năng:** Các gói .deb được biên dịch và đóng gói chuẩn bảo mật, không gây xung đột hệ thống.\n- **Dễ dàng cài đặt:** Thêm nguồn trực tiếp chỉ bằng một chạm trên thiết bị iOS.`,
    demoUrl: 'https://bctoiws0902.github.io/tweak_for_ios12/',
    githubUrl: 'https://github.com/BCToiws0902/tweak_for_ios12',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
    actionButtonLabel: 'XEM KHO REPO CYDIA',
    platform: 'iOS 12+ (Jailbroken)',
    version: 'v1.0.0',
    fileSize: 'APT Repo',
    order: 2,
    featured: true,
    published: true,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('bctweaks-repo').set(project2Data, { merge: true });
  console.log('✅ Synchronized project BCTweaksRepo (Clean Vietnamese)');

  // 5. Project PTZ Controller Portable
  const project3Data = {
    id: 'ptz-controller-portable',
    slug: 'ptz-controller-portable',
    title: 'PTZ Controller Portable',
    category: 'Camera Tool / Hardware Utility',
    tags: ['PTZ Camera', 'VISCA Serial', '.NET WinForms', 'Always-On-Top', 'Portable App'],
    description: 'Ứng dụng Windows portable điều khiển camera hội nghị PTZ qua giao thức VISCA Serial (USB COM port), hỗ trợ bàn phím điều hướng 8 hướng, thu phóng quang học và cửa sổ điều khiển nổi trong suốt Always-On-Top tiện lợi.',
    shortDescription: 'Ứng dụng Windows portable điều khiển camera hội nghị PTZ qua giao thức VISCA Serial (USB COM port), hỗ trợ bàn phím điều hướng 8 hướng, thu phóng quang học và cửa sổ điều khiển nổi trong suốt Always-On-Top tiện lợi.',
    content: `# Giới Thiệu PTZ Controller Portable\n\nCông cụ Windows Portable độc lập chuyên dụng để điều khiển các dòng **Camera hội nghị truyền hình Pan-Tilt-Zoom (PTZ)** thông qua giao thức nối tiếp chuẩn công nghiệp **Sony VISCA Protocol** (RS-232 / RS-422 / USB-to-Serial COM port).\n\n### Tính Năng Đột Phá\n- **Bàn điều khiển nổi trong suốt (Frameless & Transparent):** Ẩn viền thanh tiêu đề, nền trong suốt nhìn xuyên thấu xuống màn hình desktop hoặc video camera bên dưới.\n- **Kéo rê di chuyển linh hoạt (Right-Click Drag):** Bấm giữ chuột phải vào bất kỳ nút nào để kéo cửa sổ bay tự do khắp màn hình.\n- **Tùy chỉnh tốc độ mượt mà:** Tinh chỉnh độc lập tốc độ xoay ngang (Pan Speed 1-24), xoay dọc (Tilt Speed 1-20) và thu phóng ống kính (Zoom Speed 0-7).\n- **Chạy ngay không cần cài đặt (Single-file Portable):** File .EXE đóng gói sẵn, không cần cài .NET runtime phụ trợ.`,
    demoUrl: 'https://github.com/BCToiws0902/PTZ-Controller-Portable',
    githubUrl: 'https://github.com/BCToiws0902/PTZ-Controller-Portable',
    downloadUrl: 'https://github.com/BCToiws0902/PTZ-Controller-Portable/releases',
    thumbnail: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=80&w=1200',
    coverImage: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=80&w=1200',
    actionButtonLabel: 'TẢI BẢN PORTABLE .EXE',
    platform: 'Windows 10/11 x64',
    version: 'v1.0.0',
    fileSize: '~51 MB (Single-file)',
    order: 3,
    featured: true,
    published: true,
    createdAt: new Date().toISOString()
  };

  await db.collection('projects').doc('ptz-controller-portable').set(project3Data, { merge: true });
  console.log('✅ Synchronized project PTZ Controller Portable (Clean Vietnamese)');

  console.log('🎉 All Firestore data successfully synchronized with 100% clean Vietnamese UTF-8!');
}

syncAll().then(() => process.exit(0)).catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});