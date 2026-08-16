import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const CodeTypewriter = () => {
  const { t } = useTranslation();
  const codeContent = [
    { line: 0, text: "const Dell_phai_developer = {", tokens: [
      { text: "const ", color: "var(--accent-secondary)" },
      { text: "Dell_phai_developer", color: "var(--accent-main)" },
      { text: " = {", color: "" }
    ]},
    { line: 1, text: `  name: 'BCT0902',`, tokens: [
      { text: "  name: ", color: "" },
      { text: "'BCT0902'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 2, text: `  role: '${t('about.role_value')}',`, tokens: [
      { text: `  ${t('about.role_label')}: `, color: "" },
      { text: `'${t('about.role_value')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 3, text: "  coffee: true,", tokens: [
      { text: "  coffee: ", color: "" },
      { text: "true", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 4, text: `  ${t('about.skills_label')}: [`, tokens: [
      { text: `  ${t('about.skills_label')}: [`, color: "" }
    ]},
    { line: 5, text: `    '${t('about.skills_wrong_code')}',`, tokens: [
      { text: `    '${t('about.skills_wrong_code')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 7, text: `    '${t('about.skills_wrong_logic')}',`, tokens: [
      { text: `    '${t('about.skills_wrong_logic')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 8, text: `    '${t('about.skills_wrong_design')}',`, tokens: [
      { text: `    '${t('about.skills_wrong_design')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 9, text: `    '${t('about.skills_wrong_handsome')}'`, tokens: [
      { text: `    '${t('about.skills_wrong_handsome')}'`, color: "#10b981" }
    ]},
    { line: 10, text: "  ]", tokens: [
      { text: "  ]", color: "" }
    ]},
    { line: 11, text: "};", tokens: [
      { text: "};", color: "" }
    ]}
  ];

  // Starting typing effect
  const startIndex = 7;
  const staticText = codeContent.slice(0, startIndex).map(l => l.text).join('\n') + '\n';
  const dynamicText = codeContent.slice(startIndex).map(l => l.text).join('\n');
  const fullText = staticText + dynamicText;
  
  const [visibleChars, setVisibleChars] = useState(staticText.length);

  useEffect(() => {
    let timer;
    const startTyping = () => {
      timer = setInterval(() => {
        setVisibleChars(prev => {
          if (prev < fullText.length) return prev + 1;
          clearInterval(timer);
          setTimeout(() => {
            setVisibleChars(staticText.length);
            startTyping();
          }, 3000); // 3 second pause then loop
          return prev;
        });
      }, 50);
    };

    startTyping();
    return () => clearInterval(timer);
  }, [fullText.length, staticText.length]);

  let globalCharCount = 0;

  return (
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6rem', minHeight: '260px' }}>
      {codeContent.map((lineData, lineIdx) => {
        const lineStart = globalCharCount;
        globalCharCount += lineData.text.length + 1;
        
        return (
          <div key={lineIdx} style={{ whiteSpace: 'pre' }}>
            {lineData.tokens.map((token, tokenIdx) => {
              const tokenStartInLine = lineData.text.indexOf(token.text);
              const charsInLineSoFar = visibleChars - lineStart;
              
              if (charsInLineSoFar <= tokenStartInLine) return null;
              
              const displayedToken = token.text.slice(0, charsInLineSoFar - tokenStartInLine);
              
              return (
                <span key={tokenIdx} style={{ color: token.color }}>
                  {displayedToken}
                </span>
              );
            })}
            {visibleChars >= lineStart && visibleChars < globalCharCount && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ borderLeft: '2px solid var(--accent-main)', marginLeft: '1px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const BioTerminal = () => {
  const { t } = useTranslation();
  const bioContent = [
    { line: 0, text: "const PersonalInfo = {", tokens: [
      { text: "const ", color: "var(--accent-secondary)" },
      { text: "PersonalInfo", color: "var(--accent-main)" },
      { text: " = {", color: "" }
    ]},
    { line: 1, text: `  age: 25,`, tokens: [
      { text: "  age: ", color: "" },
      { text: "25", color: "#f59e0b" },
      { text: ",", color: "" }
    ]},
    { line: 2, text: `  hometown: '${t('about.hometown_value')}',`, tokens: [
      { text: `  ${t('about.hometown_label')}: `, color: "" },
      { text: `'${t('about.hometown_value')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 3, text: `  residence: '${t('about.residence_value')}',`, tokens: [
      { text: `  ${t('about.residence_label')}: `, color: "" },
      { text: `'${t('about.residence_value')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 4, text: `  major: '${t('about.major_value')}',`, tokens: [
      { text: `  ${t('about.major_label')}: `, color: "" },
      { text: `'${t('about.major_value')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 5, text: `  ${t('about.hobbies_label')}: [`, tokens: [
      { text: `  ${t('about.hobbies_label')}: [`, color: "" }
    ]},
    { line: 6, text: `    '${t('about.hobbies_music')}',`, tokens: [
      { text: `    '${t('about.hobbies_music')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 7, text: `    '${t('about.hobbies_walking')}',`, tokens: [
      { text: `    '${t('about.hobbies_walking')}'`, color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 8, text: `    '${t('about.hobbies_apples')}'`, tokens: [
      { text: `    '${t('about.hobbies_apples')}'`, color: "#10b981" }
    ]},
    { line: 9, text: "  ]", tokens: [
      { text: "  ]", color: "" }
    ]},
    { line: 10, text: "};", tokens: [
      { text: "};", color: "" }
    ]}
  ];

  // Starting typing effect
  const startIndex = 7;
  const staticText = bioContent.slice(0, startIndex).map(l => l.text).join('\n') + '\n';
  const dynamicText = bioContent.slice(startIndex).map(l => l.text).join('\n');
  const fullText = staticText + dynamicText;

  const [visibleChars, setVisibleChars] = useState(staticText.length);

  useEffect(() => {
    let timer;
    const startTyping = () => {
      timer = setInterval(() => {
        setVisibleChars(prev => {
          if (prev < fullText.length) return prev + 1;
          clearInterval(timer);
          setTimeout(() => {
            setVisibleChars(staticText.length);
            startTyping();
          }, 3000); // 3 second pause
          return prev;
        });
      }, 40);
    };

    startTyping();
    return () => clearInterval(timer);
  }, [fullText.length, staticText.length]);

  let globalCharCount = 0;

  return (
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6rem', minHeight: '280px', fontFamily: 'var(--font-mono)' }}>
      {bioContent.map((lineData, lineIdx) => {
        const lineStart = globalCharCount;
        globalCharCount += lineData.text.length + 1;
        
        return (
          <div key={lineIdx} style={{ whiteSpace: 'pre' }}>
            {lineData.tokens.map((token, tokenIdx) => {
              const tokenStartInLine = lineData.text.indexOf(token.text);
              const charsInLineSoFar = visibleChars - lineStart;
              if (charsInLineSoFar <= tokenStartInLine) return null;
              const displayedToken = token.text.slice(0, charsInLineSoFar - tokenStartInLine);
              return <span key={tokenIdx} style={{ color: token.color }}>{displayedToken}</span>;
            })}
            {visibleChars >= lineStart && visibleChars < globalCharCount && (
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ borderLeft: '2px solid var(--accent-main)', marginLeft: '1px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" style={{ padding: '3rem 2rem 1rem', background: 'transparent' }}>
      <div className="container">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ 
            fontSize: '3rem', 
            marginBottom: '4rem', 
            textAlign: 'center',
            fontFamily: "'Chakra Petch', sans-serif"
          }}
        >
          <span className="text-gradient">{t('about.title')}</span>
        </motion.h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          
          {}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="glass-panel"
            style={{ 
              padding: '2rem', 
              fontFamily: 'var(--font-mono)',
              minHeight: '260px'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: '1rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{t('about.bio_file')}</span>
            </div>
            <BioTerminal />
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="glass-panel"
            style={{ padding: '2rem', fontFamily: 'var(--font-mono)', minHeight: '260px' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: '1rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{t('about.coding_file')}</span>
            </div>
            
            <CodeTypewriter />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default About;
