import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('bct_admin_session') === 'true');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);

                if (user.email === 'buicongtoi01@gmail.com') {
                    setIsAdmin(true);

                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        displayName: user.displayName || 'Bùi Công Tới',
                        role: 'admin',
                        lastLogin: new Date()
                    }, { merge: true });
                } else {
                    
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().role === 'admin') {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                }
            } else {
                setCurrentUser(null);

                if (localStorage.getItem('bct_admin_session') === 'true') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            }
        });

        if (localStorage.getItem('bct_admin_session') === 'true') {
            setIsAdmin(true);
        }

        return unsubscribe;
    }, []);

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('bct_admin_session');
        setIsAdmin(false);
    };

    const loginAsAdminLocal = () => {
        localStorage.setItem('bct_admin_session', 'true');
        setIsAdmin(true);
    };

    const value = {
        currentUser,
        isAdmin,
        logout,
        loginAsAdminLocal
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
