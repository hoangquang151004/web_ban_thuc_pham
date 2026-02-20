'use client';

import React, { useEffect, useRef, useState } from 'react';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    ts: number;
};

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Xin chào! Mình là trợ lý sản phẩm. Bạn cần tư vấn gì hôm nay?',
            ts: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text) return;
        setInput('');
        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: text,
            ts: Date.now()
        };
        setMessages((m) => [...m, userMsg]);
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            const botMsg: Message = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: data?.reply || 'Xin lỗi, hiện mình chưa có câu trả lời.',
                ts: Date.now()
            };
            setMessages((m) => [...m, botMsg]);
        } catch (e) {
            const errMsg: Message = {
                id: `e-${Date.now()}`,
                role: 'assistant',
                content: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
                ts: Date.now()
            };
            setMessages((m) => [...m, errMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                aria-label="Mở chatbot"
                onClick={() => setOpen((o) => !o)}
                style={{
                    position: 'fixed',
                    right: 16,
                    bottom: 16,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    cursor: 'pointer',
                    zIndex: 50
                }}
            >
                {open ? '×' : 'Chat'}
            </button>

            {/* Panel */}
            {open && (
                <div
                    role="dialog"
                    aria-label="Chatbot tư vấn sản phẩm"
                    style={{
                        position: 'fixed',
                        right: 16,
                        bottom: 80,
                        width: 360,
                        maxWidth: '90vw',
                        height: 480,
                        maxHeight: '70vh',
                        background: '#ffffff',
                        borderRadius: 12,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 50
                    }}
                >
                    <div
                        style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid #eee',
                            background: '#f8fafc',
                            fontWeight: 600
                        }}
                    >
                        Trợ lý sản phẩm
                    </div>

                    <div
                        style={{
                            flex: 1,
                            padding: 12,
                            overflowY: 'auto',
                            background: '#fafafa'
                        }}
                    >
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: 8
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '80%',
                                        padding: '8px 10px',
                                        borderRadius: 10,
                                        background: m.role === 'user' ? '#10b981' : '#e5e7eb',
                                        color: m.role === 'user' ? '#fff' : '#111827',
                                        fontSize: 14,
                                        lineHeight: 1.4
                                    }}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && <div style={{ color: '#6b7280', fontSize: 12 }}>Đang soạn trả lời…</div>}
                        <div ref={endRef} />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            padding: 12,
                            borderTop: '1px solid #eee',
                            background: '#fff'
                        }}
                    >
                        <input
                            aria-label="Nhập câu hỏi"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Hỏi về sản phẩm, giá, khuyến mãi…"
                            style={{
                                flex: 1,
                                padding: '10px 12px',
                                borderRadius: 8,
                                border: '1px solid #e5e7eb',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#10b981',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
