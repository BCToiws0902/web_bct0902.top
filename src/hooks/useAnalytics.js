import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const getOrCreateVisitorId = () => {
    try {
        let vid = localStorage.getItem('bct_visitor_id');
        if (!vid) {
            vid = 'vid_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
            localStorage.setItem('bct_visitor_id', vid);
        }
        return vid;
    } catch {
        return 'vid_anon_' + Date.now();
    }
};

const getDeviceInfo = () => {
    try {
        const ua = navigator.userAgent;
        let os = 'Desktop';
        let browser = 'Browser';

        if (/iPhone/i.test(ua)) os = 'iPhone';
        else if (/iPad/i.test(ua)) os = 'iPad';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        if (/Edg/i.test(ua)) browser = 'Edge';
        else if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';

        const isMobile = /iPhone|iPad|Android/i.test(ua);

        return {
            isMobile,
            deviceLabel: `${os} · ${browser}`
        };
    } catch {
        return { isMobile: false, deviceLabel: 'Unknown Device' };
    }
};

export const useAnalytics = () => {
    const trackEvent = async (eventName, params = {}) => {
        try {
            const visitorId = getOrCreateVisitorId();
            const isAdmin = localStorage.getItem('bct_admin_session') === 'true';
            const { isMobile, deviceLabel } = getDeviceInfo();

            await addDoc(collection(db, 'system_analytics'), {
                event: eventName,
                visitorId,
                isAdmin,
                deviceLabel,
                isMobile,
                ...params,
                path: window.location.pathname,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent
            });
        } catch (err) {
            console.error("Analytics Error:", err);
        }
    };

    return { trackEvent };
};
