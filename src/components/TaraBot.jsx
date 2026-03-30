import { useState } from 'react';

export default function TaraBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "Hi! I'm TARA 👋 Your AI learning companion. How can I help?", isUser: false }
    ]);

    const sendTara = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { text: input, isUser: true }]);
        setInput('');

        setTimeout(() => {
            setMessages(prev => [...prev, { text: "I'm here to help! Keep learning. 😊", isUser: false }]);
            if (window.speechSynthesis) {
                const utt = new SpeechSynthesisUtterance("I'm here to help! Keep learning.");
                window.speechSynthesis.speak(utt);
            }
        }, 600);
    };

    return (
        <>
            <button id="tara-btn" onClick={() => setIsOpen(!isOpen)}>
                <div className="tara-face">
                    <div className="tara-eye left blink"></div>
                    <div className="tara-eye right blink"></div>
                    <div className="tara-mouth idle"></div>
                </div>
            </button>

            {isOpen && (
                <div id="tara-chat" style={{ display: 'flex' }}>
                    <div className="tara-header">
                        <div className="tara-header-face">🤖</div>
                        <div className="tara-header-info">
                            <div className="name">TARA Bot</div>
                            <div className="status">● Online</div>
                        </div>
                    </div>
                    <div className="tara-msgs">
                        {messages.map((m, i) => (
                            <div key={i} className={`msg ${m.isUser ? 'user-msg' : 'bot'}`}>{m.text}</div>
                        ))}
                    </div>
                    <div className="tara-input-row">
                        <input
                            className="tara-input"
                            placeholder="Ask TARA anything…"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && sendTara()}
                        />
                        <button className="tara-send" onClick={sendTara}>➤</button>
                    </div>
                </div>
            )}
        </>
    );
}