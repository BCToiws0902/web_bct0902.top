import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const defaultConfig = {
      appearance: {
        theme: 'dark',
        logoUrl: '/logobct.png',
        primaryColor: '#ff9a3d',
        accentColor: '#ffb000',
        pixelGlow: 'rgba(255, 154, 61, 0.4)',
        utilityBackground: '',
        utilityGlassBlur: 15
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
        about: false,
        skills: false
      },
      integrations: {
        emailjsServiceId: '',
        emailjsTemplateId: '',
        emailjsPublicKey: '',
        geminiKey: ''
      }
    };

    const [config, setConfig] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const configDocRef = doc(db, 'system', 'config');
        const contentDocRef = doc(db, 'system', 'content');
        const memoriesDocRef = doc(db, 'system', 'memories');

        updateDynamicStyles(defaultConfig.appearance);

        const loadConfig = async () => {
            try {
                
                const [configSnap, contentSnap, memoriesSnap, memoriesColSnap] = await Promise.all([
                    getDoc(configDocRef),
                    getDoc(contentDocRef),
                    getDoc(memoriesDocRef), 
                    getDocs(query(collection(db, 'memories'), orderBy('order', 'asc')))
                ]);

                let mergedData = { ...defaultConfig };

                if (configSnap.exists()) mergedData = { ...mergedData, ...configSnap.data() };
                if (contentSnap.exists()) mergedData.content = { ...mergedData.content, ...contentSnap.data() };

                if (!memoriesColSnap.empty) {
                    const colImages = memoriesColSnap.docs.map(doc => doc.data().url);
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

        const unsubscribe = onSnapshot(configDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setConfig(prev => ({ ...prev, ...data }));
                updateDynamicStyles(data.appearance);
            }
        });

        loadConfig();

        return () => unsubscribe();
    }, []);

    const updateDynamicStyles = (appearance) => {
        if (!appearance) return;
        const root = document.documentElement;
        if (appearance.primaryColor) root.style.setProperty('--accent-main', appearance.primaryColor);
        if (appearance.accentColor) root.style.setProperty('--accent-secondary', appearance.accentColor);
        if (appearance.pixelGlow) root.style.setProperty('--accent-glow', appearance.pixelGlow);
        if (appearance.utilityBackground) {
            root.style.setProperty('--utility-bg', `url('${appearance.utilityBackground}')`);
        } else {
            root.style.setProperty('--utility-bg', "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 240, 1) 100%)");
        }
        root.style.setProperty('--utility-blur', `${appearance.utilityGlassBlur || 15}px`);
    };

    return (
        <ConfigContext.Provider value={{ config, loading }}>
            {children}
        </ConfigContext.Provider>
    );
};
