'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Rating } from 'primereact/rating';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { useRef, useState, useEffect } from 'react';
import { reviewAPI } from '@/services/api';
import { Tag } from 'primereact/tag';
import Image from 'next/image';

interface Review {
    id: number;
    product: number;
    product_name: string;
    product_image: string;
    order: number;
    order_number: string;
    rating: number;
    comment: string;
    images: string[];
    is_verified_purchase: boolean;
    created_at: string;
    updated_at: string;
}

interface ReviewableProduct {
    product_id: number;
    product_name: string;
    product_image: string;
    order_id: number;
    order_number: string;
    order_date: string;
}

const ReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [unreviewedProducts, setUnreviewedProducts] = useState<ReviewableProduct[]>([]);
    const [reviewDialog, setReviewDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentReview, setCurrentReview] = useState<any>({
        id: 0,
        product_id: 0,
        product_name: '',
        product_image: '',
        order_id: 0,
        order_number: '',
        rating: 5,
        comment: '',
        images: []
    });
    const toast = useRef<Toast>(null);

    // Load data on mount
    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([loadReviews(), loadReviewableProducts()]);
        };
        initializeData();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getMyReviews();
            console.log('My reviews response:', response);

            if (response && typeof response === 'object' && !Array.isArray(response)) {
                // Nếu response là object với message lỗi
                if (response.message || response.error) {
                    throw new Error(response.message || response.error);
                }
            }

            setReviews(Array.isArray(response) ? response : []);
        } catch (error: any) {
            console.error('Error loading reviews:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi tải đánh giá',
                detail: error.message || 'Không thể tải danh sách đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const loadReviewableProducts = async () => {
        try {
            const response = await reviewAPI.getReviewableProducts();
            console.log('Reviewable products response:', response);

            if (response && typeof response === 'object' && !Array.isArray(response)) {
                // Nếu response là object với message lỗi
                if (response.message || response.error) {
                    throw new Error(response.message || response.error);
                }
            }

            // Sắp xếp theo ngày mới nhất
            const products = Array.isArray(response) ? response : [];
            const sortedProducts = products.sort((a, b) => {
                return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
            });

            setUnreviewedProducts(sortedProducts);
        } catch (error: any) {
            console.error('Error loading reviewable products:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi tải sản phẩm',
                detail: error.message || 'Không thể tải danh sách sản phẩm chưa đánh giá',
                life: 3000
            });
        }
    };

    const openNewReview = (product: ReviewableProduct) => {
        setEditMode(false);
        setCurrentReview({
            id: 0,
            product_id: product.product_id,
            product_name: product.product_name,
            product_image: product.product_image,
            order_id: product.order_id,
            order_number: product.order_number,
            rating: 5,
            comment: '',
            images: []
        });
        setReviewDialog(true);
    };

    const openEditReview = (review: Review) => {
        setEditMode(true);
        setCurrentReview({
            ...review,
            product_id: review.product,
            product_name: review.product_name,
            product_image: review.product_image,
            order_id: review.order,
            order_number: review.order_number
        });
        setReviewDialog(true);
    };

    const hideDialog = () => {
        setReviewDialog(false);
        setCurrentReview({
            id: 0,
            product_id: 0,
            product_name: '',
            product_image: '',
            order_id: 0,
            order_number: '',
            rating: 5,
            comment: '',
            images: []
        });
    };

    const saveReview = async () => {
        if (!currentReview.comment.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng nhập nội dung đánh giá',
                life: 3000
            });
            return;
        }

        try {
            setLoading(true);

            if (editMode) {
                const response = await reviewAPI.update(currentReview.id, {
                    rating: currentReview.rating,
                    comment: currentReview.comment,
                    images: currentReview.images
                });

                if (response.review) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: response.message || 'Đánh giá đã được cập nhật',
                        life: 3000
                    });
                    loadReviews();
                }
            } else {
                const response = await reviewAPI.create({
                    product_id: currentReview.product_id,
                    order_id: currentReview.order_id,
                    rating: currentReview.rating,
                    comment: currentReview.comment,
                    images: currentReview.images
                });

                if (response.review) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: response.message || 'Đánh giá đã được gửi',
                        life: 3000
                    });
                    loadReviews();
                    loadReviewableProducts();
                }
            }

            hideDialog();
        } catch (error: any) {
            console.error('Error saving review:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể lưu đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (review: Review) => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa đánh giá của "${review.product_name}"?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteReview(review.id),
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const deleteReview = async (id: number) => {
        try {
            setLoading(true);
            await reviewAPI.delete(id);

            toast.current?.show({
                severity: 'success',
                summary: 'Đã xóa',
                detail: 'Đánh giá đã được xóa',
                life: 3000
            });

            loadReviews();
            loadReviewableProducts();
        } catch (error: any) {
            console.error('Error deleting review:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể xóa đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const productBodyTemplate = (rowData: Review | ReviewableProduct) => {
        const isReview = 'created_at' in rowData; // Review có created_at, ReviewableProduct có order_date
        const image = isReview ? (rowData as Review).product_image : (rowData as ReviewableProduct).product_image;
        const name = isReview ? (rowData as Review).product_name : (rowData as ReviewableProduct).product_name;
        const orderNum = isReview ? (rowData as Review).order_number : (rowData as ReviewableProduct).order_number;

        return (
            <div className="flex align-items-center">
                {image && (
                    <div style={{ position: 'relative', width: '4rem', height: '4rem', marginRight: '0.75rem' }}>
                        <Image src={image} alt={name} fill style={{ objectFit: 'cover', borderRadius: '6px' }} sizes="64px" />
                    </div>
                )}
                <div>
                    <div className="font-bold">{name}</div>
                    <div className="text-sm text-600">Đơn hàng: {orderNum}</div>
                </div>
            </div>
        );
    };

    const getDaysAgo = (dateString: string) => {
        const orderDate = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const orderDateBodyTemplate = (rowData: ReviewableProduct) => {
        const daysAgo = getDaysAgo(rowData.order_date);
        const orderDate = new Date(rowData.order_date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        return (
            <div>
                <div className="font-semibold">{daysAgo} ngày trước</div>
                <div className="text-sm text-500">{orderDate}</div>
            </div>
        );
    };

    const ratingBodyTemplate = (rowData: Review) => {
        return <Rating value={rowData.rating} readOnly cancel={false} />;
    };

    const actionBodyTemplate = (rowData: Review) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined onClick={() => openEditReview(rowData)} tooltip="Sửa" />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Xóa" />
            </div>
        );
    };

    const unreviewedActionTemplate = (rowData: ReviewableProduct) => {
        return <Button label="Đánh giá ngay" icon="pi pi-star" onClick={() => openNewReview(rowData)} />;
    };

    const dateBodyTemplate = (rowData: Review) => {
        return new Date(rowData.created_at).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const verifiedBodyTemplate = (rowData: Review) => {
        return rowData.is_verified_purchase ? <Tag value="Đã mua hàng" severity="success" icon="pi pi-check-circle" /> : null;
    };

    const commentBodyTemplate = (rowData: Review) => {
        const comment = rowData.comment || '';
        if (comment.length > 100) {
            return (
                <div className="text-overflow-ellipsis overflow-hidden white-space-nowrap" title={comment}>
                    {comment.substring(0, 100)}...
                </div>
            );
        }
        return comment;
    };

    const dialogFooter = (
        <div>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} disabled={loading} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveReview} loading={loading} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="col-12">
                <div className="card">
                    <h5>
                        <i className="pi pi-star-fill mr-2 text-yellow-500"></i>
                        Sản phẩm chưa đánh giá
                    </h5>

                    {loading ? (
                        <div className="text-center py-5">
                            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                            <p className="text-600 mt-3">Đang tải sản phẩm...</p>
                        </div>
                    ) : unreviewedProducts.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="pi pi-check-circle text-6xl text-green-400 mb-3"></i>
                            <h6 className="text-600">Bạn đã đánh giá tất cả sản phẩm đã mua</h6>
                            <p className="text-500 text-sm mt-2">Mua thêm sản phẩm để có thể đánh giá nhé!</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-content-between align-items-center mb-3">
                                <p className="text-600 m-0">
                                    Bạn có <strong className="text-primary">{unreviewedProducts.length}</strong> sản phẩm chưa đánh giá
                                </p>
                            </div>
                            <DataTable value={unreviewedProducts} responsiveLayout="scroll" emptyMessage="Không có sản phẩm nào" stripedRows paginator rows={5} rowsPerPageOptions={[5, 10, 15]}>
                                <Column header="Sản phẩm" body={productBodyTemplate} style={{ minWidth: '300px' }} />
                                <Column header="Ngày đặt hàng" body={orderDateBodyTemplate} style={{ minWidth: '150px' }} />
                                <Column body={unreviewedActionTemplate} style={{ width: '200px' }} />
                            </DataTable>
                        </>
                    )}
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <h5>
                        <i className="pi pi-list mr-2"></i>
                        Đánh giá của tôi
                    </h5>

                    {loading ? (
                        <div className="text-center py-5">
                            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                            <p className="text-600 mt-3">Đang tải đánh giá...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="pi pi-star text-6xl text-400 mb-3"></i>
                            <h6 className="text-600">Bạn chưa có đánh giá nào</h6>
                            <p className="text-500 text-sm mt-2">Hãy mua hàng và đánh giá sản phẩm nhé!</p>
                        </div>
                    ) : (
                        <DataTable value={reviews} responsiveLayout="scroll" paginator rows={10} emptyMessage="Không có đánh giá nào">
                            <Column header="Sản phẩm" body={productBodyTemplate} style={{ minWidth: '300px' }} />
                            <Column header="Đánh giá" body={ratingBodyTemplate} style={{ minWidth: '150px' }} />
                            <Column header="Trạng thái" body={verifiedBodyTemplate} style={{ minWidth: '120px' }} />
                            <Column header="Nhận xét" body={commentBodyTemplate} style={{ minWidth: '300px', maxWidth: '300px' }} />
                            <Column header="Ngày đánh giá" body={dateBodyTemplate} style={{ minWidth: '120px' }} />
                            <Column body={actionBodyTemplate} exportable={false} style={{ width: '150px' }} />
                        </DataTable>
                    )}
                </div>
            </div>

            <Dialog visible={reviewDialog} style={{ width: '600px' }} header={editMode ? 'Sửa đánh giá' : 'Đánh giá sản phẩm'} modal className="p-fluid" footer={dialogFooter} onHide={hideDialog}>
                <div className="field">
                    <div className="flex align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                        {currentReview.product_image && (
                            <div style={{ position: 'relative', width: '5rem', height: '5rem', marginRight: '0.75rem' }}>
                                <Image src={currentReview.product_image} alt={currentReview.product_name} fill style={{ objectFit: 'cover', borderRadius: '6px' }} sizes="80px" />
                            </div>
                        )}
                        <div>
                            <div className="font-bold text-lg">{currentReview.product_name}</div>
                            <div className="text-600">Đơn hàng: {currentReview.order_number}</div>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label>Đánh giá của bạn</label>
                    <Rating value={currentReview.rating} onChange={(e) => setCurrentReview({ ...currentReview, rating: e.value })} cancel={false} className="text-2xl" />
                </div>

                <div className="field">
                    <label htmlFor="comment">Nhận xét của bạn *</label>
                    <InputTextarea
                        id="comment"
                        value={currentReview.comment}
                        onChange={(e) => setCurrentReview({ ...currentReview, comment: e.target.value })}
                        rows={5}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        disabled={loading}
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default ReviewsPage;
