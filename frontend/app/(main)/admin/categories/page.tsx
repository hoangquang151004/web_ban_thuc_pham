/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState } from 'react';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';

interface Category {
    id: number;
    name: string;
    description: string;
    status: string;
    productCount: number;
    createdAt: string;
}

const CategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([
        {
            id: 1,
            name: 'Rau Củ Quả',
            description: 'Rau củ quả tươi sạch, organic',
            status: 'active',
            productCount: 45,
            createdAt: '2024-01-15'
        },
        {
            id: 2,
            name: 'Thịt Tươi',
            description: 'Thịt bò, heo, gà tươi sống',
            status: 'active',
            productCount: 32,
            createdAt: '2024-01-16'
        },
        {
            id: 3,
            name: 'Hải Sản',
            description: 'Hải sản tươi sống chất lượng cao',
            status: 'active',
            productCount: 28,
            createdAt: '2024-01-17'
        },
        {
            id: 4,
            name: 'Trứng & Sữa',
            description: 'Trứng gà, trứng vịt, sữa các loại',
            status: 'active',
            productCount: 18,
            createdAt: '2024-01-18'
        },
        {
            id: 5,
            name: 'Gạo & Ngũ Cốc',
            description: 'Gạo sạch, ngũ cốc dinh dưỡng',
            status: 'active',
            productCount: 25,
            createdAt: '2024-01-19'
        }
    ]);

    const [categoryDialog, setCategoryDialog] = useState(false);
    const [deleteCategoryDialog, setDeleteCategoryDialog] = useState(false);
    const [category, setCategory] = useState<Category>({
        id: 0,
        name: '',
        description: '',
        status: 'active',
        productCount: 0,
        createdAt: ''
    });
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);

    const statuses = [
        { label: 'Hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' }
    ];

    const openNew = () => {
        setCategory({
            id: 0,
            name: '',
            description: '',
            status: 'active',
            productCount: 0,
            createdAt: ''
        });
        setCategoryDialog(true);
    };

    const hideDialog = () => {
        setCategoryDialog(false);
    };

    const hideDeleteCategoryDialog = () => {
        setDeleteCategoryDialog(false);
    };

    const saveCategory = () => {
        if (category.name.trim()) {
            let _categories = [...categories];

            if (category.id) {
                const index = _categories.findIndex((c) => c.id === category.id);
                _categories[index] = category;
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật danh mục thành công',
                    life: 3000
                });
            } else {
                category.id = Math.max(..._categories.map((c) => c.id), 0) + 1;
                category.createdAt = new Date().toISOString().split('T')[0];
                category.productCount = 0;
                _categories.push(category);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Thêm danh mục thành công',
                    life: 3000
                });
            }

            setCategories(_categories);
            setCategoryDialog(false);
            setCategory({
                id: 0,
                name: '',
                description: '',
                status: 'active',
                productCount: 0,
                createdAt: ''
            });
        }
    };

    const editCategory = (category: Category) => {
        setCategory({ ...category });
        setCategoryDialog(true);
    };

    const confirmDeleteCategory = (category: Category) => {
        setCategory(category);
        setDeleteCategoryDialog(true);
    };

    const deleteCategory = () => {
        let _categories = categories.filter((val) => val.id !== category.id);
        setCategories(_categories);
        setDeleteCategoryDialog(false);
        setCategory({
            id: 0,
            name: '',
            description: '',
            status: 'active',
            productCount: 0,
            createdAt: ''
        });
        toast.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa danh mục thành công',
            life: 3000
        });
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _category = { ...category };
        (_category as any)[name] = val;
        setCategory(_category);
    };

    const onDropdownChange = (e: any, name: string) => {
        const val = e.value || '';
        let _category = { ...category };
        (_category as any)[name] = val;
        setCategory(_category);
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Category) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editCategory(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteCategory(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Category) => {
        return <Tag value={rowData.status === 'active' ? 'Hoạt động' : 'Ngừng'} severity={rowData.status === 'active' ? 'success' : 'danger'} />;
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Quản Lý Danh Mục</h4>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" placeholder="Tìm kiếm..." onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} />
            </span>
        </div>
    );

    const categoryDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveCategory} />
        </React.Fragment>
    );

    const deleteCategoryDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteCategoryDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteCategory} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={categories}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} danh mục"
                        globalFilter={globalFilter}
                        header={header}
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column field="name" header="Tên danh mục" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="description" header="Mô tả" sortable style={{ minWidth: '16rem' }}></Column>
                        <Column field="productCount" header="Số sản phẩm" sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="createdAt" header="Ngày tạo" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>

                    <Dialog visible={categoryDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Thông tin danh mục" modal className="p-fluid" footer={categoryDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="name">Tên danh mục</label>
                            <InputText id="name" value={category.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus />
                        </div>
                        <div className="field">
                            <label htmlFor="description">Mô tả</label>
                            <InputTextarea id="description" value={category.description} onChange={(e) => onInputChange(e, 'description')} rows={3} />
                        </div>
                        <div className="field">
                            <label htmlFor="status">Trạng thái</label>
                            <Dropdown id="status" value={category.status} options={statuses} onChange={(e) => onDropdownChange(e, 'status')} placeholder="Chọn trạng thái" />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteCategoryDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteCategoryDialogFooter} onHide={hideDeleteCategoryDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {category && (
                                <span>
                                    Bạn có chắc chắn muốn xóa danh mục <b>{category.name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default CategoriesPage;
