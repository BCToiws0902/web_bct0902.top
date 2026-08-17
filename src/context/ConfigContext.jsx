import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

const DEFAULT_CONFIG = {
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
  socials: {
    facebook: 'https://facebook.com/bct0902',
    github: 'https://github.com/bct0902',
    linkedin: 'https://linkedin.com/in/bct0902',
    youtube: 'https://youtube.com/@bct0902',
    messenger: 'bct0902'
  },
  content: {
    welcomeMessage: 'BCT Core Engine v3.0 - Đang trực tuyến. Tôi có thể giúp gì cho bạn?',
    welcomeUserMessage: '',
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
    filmStripSpeed: 45,
    filmStripImages: [
      "/film/style_korean_1775962199527.png",
      "/film/style_office_1775962215135.png",
      "/film/style_classic_1775962232413.png",
      "/film/style_landscape_1775962251170.png",
      "/film/style_gentleman_1775962276045.png",
      "/film/style_winter_1775962294966.png",
      "/film/style_korean_1775962199527.png",
      "/film/style_office_1775962215135.png"
    ]
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

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    const updateDynamicStyles = (appearance) => {
        if (!appearance) return;
        const root = document.documentElement;
        if (appearance.utilityBackground) {
            root.style.setProperty('--utility-bg', `url('${appearance.utilityBackground}')`);
        }
    };

    useEffect(() => {
        const configDocRef = doc(db, 'system', 'config');
        const contentDocRef = doc(db, 'system', 'content');
        const memoriesDocRef = doc(db, 'system', 'memories');

        updateDynamicStyles(DEFAULT_CONFIG.appearance);

        const loadConfig = async () => {
            try {
                const [configSnap, contentSnap, memoriesSnap, memoriesColSnap] = await Promise.all([
                    getDoc(configDocRef),
                    getDoc(contentDocRef),
                    getDoc(memoriesDocRef), 
                    getDocs(query(collection(db, 'memories'), orderBy('order', 'asc')))
                ]);

                let mergedData = { ...DEFAULT_CONFIG };

                if (configSnap.exists()) mergedData = { ...mergedData, ...configSnap.data() };
                if (contentSnap.exists()) mergedData.content = { ...mergedData.content, ...contentSnap.data() };

                if (!memoriesColSnap.empty) {
                    const colImages = memoriesColSnap.docs.map(d => d.data().url);
                    mergedData.content.filmStripImages = colImages;
                } else if (memoriesSnap.exists()) {
                    const memData = memoriesSnap.data();
                    if (memData.filmStripImages) mergedData.content.filmStripImages = memData.filmStripImages;
                }

                setConfig(mergedData);
                updateDynamicStyles(mergedData.appearance);
                setLoading(false);
            } catch (err) {
                console.error("Config Loading Error:", err);
                setLoading(false);
            }
        };

        const unsubscribe = onSnapshot(configDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setConfig(prev => ({ ...prev, ...data }));
                updateDynamicStyles(data.appearance);
            }
        });

        loadConfig();

        return () => unsubscribe();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, loading }}>
            {children}
        </ConfigContext.Provider>
    );
};
