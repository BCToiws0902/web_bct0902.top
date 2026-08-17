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
  social_links: [],
  content: {
    quotes: [],
    filmStripSpeed: 45,
    filmStripImages: []
  },
  apps: [],
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

                if (!memoriesColSnap.empty) {
                    const colImages = memoriesColSnap.docs.map(d => d.data().url);
                    mergedData.content = { ...(mergedData.content || {}), filmStripImages: colImages };
                } else if (memoriesSnap.exists()) {
                    const memData = memoriesSnap.data();
                    if (memData.filmStripImages) {
                        mergedData.content = { ...(mergedData.content || {}), filmStripImages: memData.filmStripImages };
                    }
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
                setConfig(prev => ({ ...prev, ...data }));
                updateDynamicStyles(data.appearance);
            }
        });

        const unsubscribeMemories = onSnapshot(memoriesDocRef, (snap) => {
            if (snap.exists()) {
                const memData = snap.data();
                if (memData.filmStripImages) {
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
