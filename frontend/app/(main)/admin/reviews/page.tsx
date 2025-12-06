/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState, useEffect } from 'react';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { reviewAPI } from '@/services/api';

interface Review {
    id: number;
    product: number;
    productName?: string;
    product_name?: string;
    user: number;
    customerName?: string;
    user_name?: string;
    user_email?: string;
    rating: number;
    comment: string;
    status?: string;
    is_approved?: boolean;
    is_verified_purchase?: boolean;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    reply?: string;
    reply_date?: string;
}

const ReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [reviewDialog, setReviewDialog] = useState(false);
    const [deleteReviewDialog, setDeleteReviewDialog] = useState(false);
    const [deleteReviewsDialog, setDeleteReviewsDialog] = useState(false);
    const [review, setReview] = useState<Review | null>(null);
    const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const toast = useRef<Toast>(null);

    // Load reviews on mount
    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getAll();

            console.log('Reviews API Response:', response);

            // Handle paginated response
            if (response.results) {
                console.log('Processing paginated results:', response.results.length, 'reviews');
                console.log('First review sample:', response.results[0]);
                setReviews(response.results);
                setTotalRecords(response.count || response.results.length);
            } else if (Array.isArray(response)) {
                console.log('Processing array response:', response.length, 'reviews');
                console.log('First review sample:', response[0]);
                setReviews(response);
                setTotalRecords(response.length);
            } else if (response.data) {
                // Handle wrapped response
                const data = response.data;
                if (data.results) {
                    console.log('Processing wrapped paginated results:', data.results.length, 'reviews');
                    console.log('First review sample:', data.results[0]);
                    setReviews(data.results);
                    setTotalRecords(data.count || data.results.length);
                } else if (Array.isArray(data)) {
                    console.log('Processing wrapped array:', data.length, 'reviews');
                    console.log('First review sample:', data[0]);
                    setReviews(data);
                    setTotalRecords(data.length);
                }
            }
        } catch (error: any) {
            console.error('Error loading reviews:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải danh sách đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filteredReviews = reviews.filter((review) => {
        // Filter by rating
        if (selectedRating !== null && review.rating !== selectedRating) {
            return false;
        }

        // Filter by status
        if (selectedStatus !== null) {
            const reviewStatus = review.status || (review.is_approved ? 'approved' : 'pending');
            if (reviewStatus !== selectedStatus) {
                return false;
            }
        }

        // Filter by search text
        if (globalFilter) {
            const searchLower = globalFilter.toLowerCase();
            const productName = (review.product_name || review.productName || '').toLowerCase();
            const userName = (review.user_name || review.customerName || '').toLowerCase();
            const comment = (review.comment || '').toLowerCase();

            if (!productName.includes(searchLower) && !userName.includes(searchLower) && !comment.includes(searchLower)) {
                return false;
            }
        }

        return true;
    });

    const clearFilters = () => {
        setGlobalFilter('');
        setSelectedRating(null);
        setSelectedStatus(null);
    };

    const viewReview = (review: Review) => {
        setReview({ ...review });
        setReviewDialog(true);
    };

    const hideDialog = () => {
        setReviewDialog(false);
        setReview(null);
    };

    const hideDeleteReviewDialog = () => {
        setDeleteReviewDialog(false);
        setReview(null);
    };

    const hideDeleteReviewsDialog = () => {
        setDeleteReviewsDialog(false);
    };

    const approveReview = async (reviewId: number) => {
        try {
            setLoading(true);
            await reviewAPI.update(reviewId, { status: 'approved' });

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã duyệt đánh giá',
                life: 3000
            });

            await loadReviews();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể duyệt đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const rejectReview = async (reviewId: number) => {
        try {
            setLoading(true);
            await reviewAPI.update(reviewId, { status: 'rejected' });

            toast.current?.show({
                severity: 'info',
                summary: 'Thông báo',
                detail: 'Đã từ chối đánh giá',
                life: 3000
            });

            await loadReviews();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể từ chối đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteReview = (review: Review) => {
        setReview(review);
        setDeleteReviewDialog(true);
    };

    const deleteReview = async () => {
        if (!review) return;

        try {
            setLoading(true);
            await reviewAPI.delete(review.id);

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Xóa đánh giá thành công',
                life: 3000
            });

            await loadReviews();
            hideDeleteReviewDialog();
        } catch (error: any) {
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

    const confirmDeleteSelected = () => {
        setDeleteReviewsDialog(true);
    };

    const deleteSelectedReviews = async () => {
        try {
            setLoading(true);

            // Delete each selected review
            const deletePromises = selectedReviews.map((review) => reviewAPI.delete(review.id));

            await Promise.all(deletePromises);

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã xóa các đánh giá đã chọn',
                life: 3000
            });

            await loadReviews();
            setSelectedReviews([]);
            setDeleteReviewsDialog(false);
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể xóa các đánh giá',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Xóa" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedReviews || !selectedReviews.length} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Review) => {
        const reviewStatus = rowData.status || (rowData.is_approved ? 'approved' : 'pending');
        const isPending = reviewStatus === 'pending' || !rowData.is_approved;

        return (
            <React.Fragment>
                <Button icon="pi pi-eye" rounded outlined className="mr-2" onClick={() => viewReview(rowData)} tooltip="Xem chi tiết" tooltipOptions={{ position: 'top' }} />
                {isPending && (
                    <>
                        <Button icon="pi pi-check" rounded outlined severity="success" className="mr-2" onClick={() => approveReview(rowData.id)} tooltip="Duyệt" tooltipOptions={{ position: 'top' }} />
                        <Button icon="pi pi-times" rounded outlined severity="warning" className="mr-2" onClick={() => rejectReview(rowData.id)} tooltip="Từ chối" tooltipOptions={{ position: 'top' }} />
                    </>
                )}
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteReview(rowData)} tooltip="Xóa" tooltipOptions={{ position: 'top' }} />
            </React.Fragment>
        );
    };

    const ratingBodyTemplate = (rowData: Review) => {
        return <Rating value={rowData.rating} readOnly cancel={false} />;
    };

    const productNameBodyTemplate = (rowData: Review) => {
        return rowData.product_name || rowData.productName || 'N/A';
    };

    const customerNameBodyTemplate = (rowData: Review) => {
        return rowData.user_name || rowData.customerName || 'N/A';
    };

    const dateBodyTemplate = (rowData: Review) => {
        const date = rowData.created_at || rowData.createdAt;
        if (!date) return 'N/A';

        try {
            return new Date(date).toLocaleDateString('vi-VN');
        } catch {
            return date;
        }
    };

    const commentBodyTemplate = (rowData: Review) => {
        const comment = rowData.comment || '';
        if (comment.length > 50) {
            return comment.substring(0, 50) + '...';
        }
        return comment;
    };

    const header = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                <h4 className="m-0">Quản Lý Đánh Giá</h4>
                <div className="flex gap-2">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText type="search" placeholder="Tìm kiếm..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </span>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3 align-items-center">
                <div className="flex align-items-center gap-2">
                    <label htmlFor="ratingFilter" className="font-semibold text-sm">
                        Số sao:
                    </label>
                    <Dropdown
                        id="ratingFilter"
                        value={selectedRating}
                        options={[
                            { label: 'Tất cả', value: null },
                            { label: '⭐ 1 sao', value: 1 },
                            { label: '⭐ 2 sao', value: 2 },
                            { label: '⭐ 3 sao', value: 3 },
                            { label: '⭐ 4 sao', value: 4 },
                            { label: '⭐ 5 sao', value: 5 }
                        ]}
                        onChange={(e) => setSelectedRating(e.value)}
                        placeholder="Chọn đánh giá"
                        style={{ width: '170px' }}
                    />
                </div>

                {(globalFilter || selectedRating !== null || selectedStatus !== null) && <Button type="button" icon="pi pi-filter-slash" label="Xóa bộ lọc" outlined onClick={clearFilters} size="small" />}

                <div className="ml-auto">
                    <Tag value={`${filteredReviews.length} đánh giá`} severity="info" icon="pi pi-comment" />
                </div>
            </div>
        </div>
    );

    const reviewDialogFooter = (
        <React.Fragment>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideDialog} />
        </React.Fragment>
    );

    const deleteReviewDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteReviewDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteReview} />
        </React.Fragment>
    );

    const deleteReviewsDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteReviewsDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteSelectedReviews} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />

                    <DataTable
                        value={filteredReviews}
                        selection={selectedReviews}
                        onSelectionChange={(e) => setSelectedReviews(e.value)}
                        selectionMode="checkbox"
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} đánh giá"
                        header={header}
                        loading={loading}
                        emptyMessage="Không tìm thấy đánh giá nào"
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column field="product_name" header="Sản phẩm" body={productNameBodyTemplate} sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="user_name" header="Khách hàng" body={customerNameBodyTemplate} sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="rating" header="Đánh giá" body={ratingBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="comment" header="Nhận xét" body={commentBodyTemplate} style={{ minWidth: '16rem' }}></Column>
                        <Column field="created_at" header="Ngày đánh giá" body={dateBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    <Dialog visible={reviewDialog} style={{ width: '40rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Chi Tiết Đánh Giá" modal footer={reviewDialogFooter} onHide={hideDialog}>
                        {review && (
                            <div className="grid">
                                <div className="col-12">
                                    <div className="field mb-4">
                                        <label className="font-bold block mb-2">Sản phẩm:</label>
                                        <p className="text-xl m-0">{review.product_name || review.productName}</p>
                                    </div>
                                    <div className="field mb-4">
                                        <label className="font-bold block mb-2">Khách hàng:</label>
                                        <p className="m-0">{review.user_name || review.customerName}</p>
                                    </div>
                                    <div className="field mb-4">
                                        <label className="font-bold block mb-2">Đánh giá:</label>
                                        <div>
                                            <Rating value={review.rating} readOnly cancel={false} />
                                        </div>
                                    </div>
                                    <div className="field mb-4">
                                        <label className="font-bold block mb-2">Nhận xét:</label>
                                        <p className="line-height-3 m-0">{review.comment}</p>
                                    </div>
                                    <div className="field mb-4">
                                        <label className="font-bold block mb-2">Ngày đánh giá:</label>
                                        <p className="m-0">{dateBodyTemplate(review)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog>

                    <Dialog visible={deleteReviewDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận xóa" modal footer={deleteReviewDialogFooter} onHide={hideDeleteReviewDialog}>
                        <div className="flex align-items-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: 'var(--red-500)' }} />
                            {review && (
                                <span>
                                    Bạn có chắc chắn muốn xóa đánh giá của <strong>{review.user_name || review.customerName}</strong>?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <Dialog visible={deleteReviewsDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận xóa" modal footer={deleteReviewsDialogFooter} onHide={hideDeleteReviewsDialog}>
                        <div className="flex align-items-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: 'var(--red-500)' }} />
                            {selectedReviews && <span>Bạn có chắc chắn muốn xóa {selectedReviews.length} đánh giá đã chọn?</span>}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;
