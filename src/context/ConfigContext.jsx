import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const DEFAULT_CONFIG = {
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
    filmStripSpeed: 45,
    filmStripImages: []
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
        const mainConfigDocRef = doc(db, 'site_config', 'main_config');
        const legacyConfigDocRef = doc(db, 'system', 'config');
        const memoriesDocRef = doc(db, 'system', 'memories');

        updateDynamicStyles(DEFAULT_CONFIG.appearance);

        const loadConfig = async () => {
            try {
                const [mainConfigSnap, legacyConfigSnap, memoriesSnap, memoriesColSnap] = await Promise.all([
                    getDoc(mainConfigDocRef),
                    getDoc(legacyConfigDocRef),
                    getDoc(memoriesDocRef), 
                    getDocs(query(collection(db, 'memories'), orderBy('order', 'asc')))
                ]);

                let mergedData = { ...DEFAULT_CONFIG };

                if (legacyConfigSnap.exists()) mergedData = { ...mergedData, ...legacyConfigSnap.data() };
                if (mainConfigSnap.exists()) mergedData = { ...mergedData, ...mainConfigSnap.data() };

                // Fallbacks if arrays are empty in Firestore
                if (!mergedData.social_links || mergedData.social_links.length === 0) {
                    mergedData.social_links = DEFAULT_CONFIG.social_links;
                }
                if (!mergedData.apps || mergedData.apps.length === 0) {
                    mergedData.apps = DEFAULT_CONFIG.apps;
                }
                if (!mergedData.content?.quotes || mergedData.content.quotes.length === 0) {
                    mergedData.content = { ...(mergedData.content || {}), quotes: DEFAULT_CONFIG.content.quotes };
                }

                if (!memoriesColSnap.empty) {
                    const colImages = memoriesColSnap.docs.map(d => d.data().url);
                    mergedData.content = { ...(mergedData.content || {}), filmStripImages: colImages };
                } else if (memoriesSnap.exists() && memoriesSnap.data()?.filmStripImages?.length > 0) {
                    mergedData.content = { ...(mergedData.content || {}), filmStripImages: memoriesSnap.data().filmStripImages };
                } else {
                    mergedData.content = { ...(mergedData.content || {}), filmStripImages: DEFAULT_CONFIG.content.filmStripImages };
                }

                setConfig(mergedData);
                updateDynamicStyles(mergedData.appearance);
                setLoading(false);
            } catch (err) {
                console.error("Config Loading Error:", err);
                setLoading(false);
            }
        };

        const unsubscribeMain = onSnapshot(mainConfigDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setConfig(prev => {
                    const nextContent = {
                        ...(prev.content || {}),
                        ...(data.content || {}),
                        filmStripImages: (data.content?.filmStripImages?.length > 0)
                            ? data.content.filmStripImages
                            : (prev.content?.filmStripImages?.length > 0 ? prev.content.filmStripImages : DEFAULT_CONFIG.content.filmStripImages),
                        quotes: (data.content?.quotes?.length > 0)
                            ? data.content.quotes
                            : (prev.content?.quotes?.length > 0 ? prev.content.quotes : DEFAULT_CONFIG.content.quotes)
                    };
                    return {
                        ...prev,
                        ...data,
                        social_links: (data.social_links?.length > 0) ? data.social_links : (prev.social_links?.length > 0 ? prev.social_links : DEFAULT_CONFIG.social_links),
                        apps: (data.apps?.length > 0) ? data.apps : (prev.apps?.length > 0 ? prev.apps : DEFAULT_CONFIG.apps),
                        content: nextContent
                    };
                });
                updateDynamicStyles(data.appearance);
            }
        });

        const unsubscribeMemories = onSnapshot(memoriesDocRef, (snap) => {
            if (snap.exists()) {
                const memData = snap.data();
                if (memData.filmStripImages && memData.filmStripImages.length > 0) {
                    setConfig(prev => ({
                        ...prev,
                        content: { ...(prev.content || {}), filmStripImages: memData.filmStripImages }
                    }));
                }
            }
        });

        loadConfig();

        return () => {
            unsubscribeMain();
            unsubscribeMemories();
        };
    }, []);

    return (
        <ConfigContext.Provider value={{ config, loading }}>
            {children}
        </ConfigContext.Provider>
    );
};
