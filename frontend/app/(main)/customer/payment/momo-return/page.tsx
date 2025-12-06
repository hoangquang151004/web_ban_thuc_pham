'use client';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PaymentResult {
    is_valid: boolean;
    is_success: boolean;
    order_id: string;
    amount: number;
    result_code: number;
    trans_id: string;
    message: string;
    error_message: string;
    pay_type?: string;
}

const MoMoReturnPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processPayment = async () => {
            try {
                // Lấy tất cả query params
                const params = new URLSearchParams(searchParams.toString());

                // Gọi API xử lý callback từ MoMo
                const response = await fetch(`${API_BASE_URL}/api/orders/momo_return/?${params.toString()}`);

                const data = await response.json();

                if (response.ok) {
                    setPaymentResult(data.transaction);
                } else {
                    setError(data.error || 'Có lỗi xảy ra khi xử lý thanh toán');
                    setPaymentResult(data.transaction);
                }
            } catch (err: any) {
                console.error('Error processing payment:', err);
                setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        processPayment();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="text-center py-8">
                            <ProgressSpinner />
                            <h3 className="mt-4">Đang xử lý thanh toán MoMo...</h3>
                            <p className="text-500">Vui lòng đợi trong giây lát</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !paymentResult) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="text-center py-8">
                            <i className="pi pi-times-circle text-6xl text-red-500 mb-4"></i>
                            <h3 className="text-red-500">Lỗi xử lý thanh toán</h3>
                            <p className="text-500 mb-4">{error}</p>
                            <div className="flex gap-2 justify-content-center">
                                <Link href="/customer/orders">
                                    <Button label="Xem đơn hàng" icon="pi pi-list" />
                                </Link>
                                <Link href="/customer/products">
                                    <Button label="Tiếp tục mua sắm" icon="pi pi-shopping-bag" severity="secondary" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    {paymentResult?.is_success ? (
                        <div className="text-center py-8">
                            <i className="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                            <h3 className="text-green-500">Thanh toán MoMo thành công!</h3>
                            <p className="text-500 mb-4">Cảm ơn bạn đã thanh toán đơn hàng qua MoMo</p>

                            <div className="surface-100 p-4 border-round mb-4 inline-block text-left">
                                <div className="grid">
                                    <div className="col-12 md:col-6 mb-3">
                                        <div className="text-500 mb-1">Mã đơn hàng:</div>
                                        <div className="font-bold">{paymentResult.order_id}</div>
                                    </div>
                                    <div className="col-12 md:col-6 mb-3">
                                        <div className="text-500 mb-1">Số tiền:</div>
                                        <div className="font-bold text-green-500">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND'
                                            }).format(paymentResult.amount)}
                                        </div>
                                    </div>
                                    <div className="col-12 md:col-6 mb-3">
                                        <div className="text-500 mb-1">Mã giao dịch MoMo:</div>
                                        <div className="font-bold">{paymentResult.trans_id}</div>
                                    </div>
                                    <div className="col-12 md:col-6 mb-3">
                                        <div className="text-500 mb-1">Phương thức:</div>
                                        <div className="font-bold">
                                            <i className="pi pi-wallet mr-2"></i>
                                            {paymentResult.pay_type || 'Ví MoMo'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="surface-card p-3 border-round mb-4 inline-flex align-items-center">
                                <i className="pi pi-info-circle text-blue-500 mr-2"></i>
                                <span className="text-sm">Đơn hàng của bạn đã được xác nhận và đang được xử lý</span>
                            </div>

                            <div className="flex gap-2 justify-content-center mt-4">
                                <Link href="/customer/orders">
                                    <Button label="Xem đơn hàng" icon="pi pi-list" />
                                </Link>
                                <Link href="/customer/products">
                                    <Button label="Tiếp tục mua sắm" icon="pi pi-shopping-bag" severity="secondary" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <i className="pi pi-times-circle text-6xl text-red-500 mb-4"></i>
                            <h3 className="text-red-500">Thanh toán MoMo thất bại</h3>
                            <p className="text-500 mb-2">{paymentResult?.error_message || paymentResult?.message || 'Có lỗi xảy ra trong quá trình thanh toán'}</p>

                            {paymentResult && (
                                <div className="surface-100 p-4 border-round mb-4 inline-block text-left">
                                    <div className="grid">
                                        <div className="col-12 mb-2">
                                            <div className="text-500 mb-1">Mã đơn hàng:</div>
                                            <div className="font-bold">{paymentResult.order_id}</div>
                                        </div>
                                        <div className="col-12 mb-2">
                                            <div className="text-500 mb-1">Mã lỗi:</div>
                                            <div className="font-bold text-red-500">{paymentResult.result_code}</div>
                                        </div>
                                        {paymentResult.trans_id && (
                                            <div className="col-12 mb-2">
                                                <div className="text-500 mb-1">Mã giao dịch:</div>
                                                <div className="font-bold">{paymentResult.trans_id}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="text-500 mb-4">Vui lòng thử lại hoặc chọn phương thức thanh toán khác</p>

                            <div className="flex gap-2 justify-content-center">
                                <Link href="/customer/orders">
                                    <Button label="Xem đơn hàng" icon="pi pi-list" />
                                </Link>
                                <Link href="/customer/products">
                                    <Button label="Tiếp tục mua sắm" icon="pi pi-shopping-bag" severity="secondary" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MoMoReturnPage;
