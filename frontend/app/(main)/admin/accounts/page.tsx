/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState } from 'react';
import { Tag } from 'primereact/tag';

interface Account {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
}

const AccountsPage = () => {
    const [accounts, setAccounts] = useState<Account[]>([
        {
            id: 1,
            fullName: 'Hoàng Văn Quang',
            email: 'quang213@food.com',
            phone: '0123456789',
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-15'
        },
        {
            id: 2,
            fullName: 'Nguyễn Hoàng Dương',
            email: 'duong321@gmail.com',
            phone: '0987654321',
            role: 'customer',
            status: 'active',
            createdAt: '2024-02-20'
        },
        {
            id: 3,
            fullName: 'Lê Thu Mai',
            email: 'mai123@gmail.com',
            phone: '0912345678',
            role: 'customer',
            status: 'inactive',
            createdAt: '2024-03-10'
        }
    ]);

    const [accountDialog, setAccountDialog] = useState(false);
    const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
    const [account, setAccount] = useState<Account>({
        id: 0,
        fullName: '',
        email: '',
        phone: '',
        role: 'customer',
        status: 'active',
        createdAt: ''
    });
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);

    const roles = [
        { label: 'Quản trị viên', value: 'admin' },
        { label: 'Khách hàng', value: 'customer' }
    ];

    const statuses = [
        { label: 'Hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' }
    ];

    const openNew = () => {
        setAccount({
            id: 0,
            fullName: '',
            email: '',
            phone: '',
            role: 'customer',
            status: 'active',
            createdAt: ''
        });
        setAccountDialog(true);
    };

    const hideDialog = () => {
        setAccountDialog(false);
    };

    const hideDeleteAccountDialog = () => {
        setDeleteAccountDialog(false);
    };

    const saveAccount = () => {
        if (account.fullName.trim()) {
            let _accounts = [...accounts];

            if (account.id) {
                const index = _accounts.findIndex((a) => a.id === account.id);
                _accounts[index] = account;
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật tài khoản thành công',
                    life: 3000
                });
            } else {
                account.id = Math.max(..._accounts.map((a) => a.id), 0) + 1;
                account.createdAt = new Date().toISOString().split('T')[0];
                _accounts.push(account);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Thêm tài khoản thành công',
                    life: 3000
                });
            }

            setAccounts(_accounts);
            setAccountDialog(false);
            setAccount({
                id: 0,
                fullName: '',
                email: '',
                phone: '',
                role: 'customer',
                status: 'active',
                createdAt: ''
            });
        }
    };

    const editAccount = (account: Account) => {
        setAccount({ ...account });
        setAccountDialog(true);
    };

    const confirmDeleteAccount = (account: Account) => {
        setAccount(account);
        setDeleteAccountDialog(true);
    };

    const deleteAccount = () => {
        let _accounts = accounts.filter((val) => val.id !== account.id);
        setAccounts(_accounts);
        setDeleteAccountDialog(false);
        setAccount({
            id: 0,
            fullName: '',
            email: '',
            phone: '',
            role: 'customer',
            status: 'active',
            createdAt: ''
        });
        toast.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa tài khoản thành công',
            life: 3000
        });
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _account = { ...account };
        (_account as any)[name] = val;
        setAccount(_account);
    };

    const onDropdownChange = (e: any, name: string) => {
        const val = e.value || '';
        let _account = { ...account };
        (_account as any)[name] = val;
        setAccount(_account);
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Account) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editAccount(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteAccount(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Account) => {
        return <Tag value={rowData.status === 'active' ? 'Hoạt động' : 'Ngừng'} severity={rowData.status === 'active' ? 'success' : 'danger'} />;
    };

    const roleBodyTemplate = (rowData: Account) => {
        return <Tag value={rowData.role === 'admin' ? 'Admin' : 'Khách hàng'} severity={rowData.role === 'admin' ? 'info' : 'warning'} />;
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Quản Lý Tài Khoản</h4>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" placeholder="Tìm kiếm..." onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} />
            </span>
        </div>
    );

    const accountDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveAccount} />
        </React.Fragment>
    );

    const deleteAccountDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteAccountDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteAccount} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={accounts}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} tài khoản"
                        globalFilter={globalFilter}
                        header={header}
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column field="fullName" header="Họ và tên" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="email" header="Email" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="phone" header="Số điện thoại" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="role" header="Vai trò" body={roleBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="createdAt" header="Ngày tạo" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>

                    <Dialog visible={accountDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Thông tin tài khoản" modal className="p-fluid" footer={accountDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="fullName">Họ và tên</label>
                            <InputText id="fullName" value={account.fullName} onChange={(e) => onInputChange(e, 'fullName')} required autoFocus />
                        </div>
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" value={account.email} onChange={(e) => onInputChange(e, 'email')} required />
                        </div>
                        <div className="field">
                            <label htmlFor="phone">Số điện thoại</label>
                            <InputText id="phone" value={account.phone} onChange={(e) => onInputChange(e, 'phone')} required />
                        </div>
                        <div className="field">
                            <label htmlFor="role">Vai trò</label>
                            <Dropdown id="role" value={account.role} options={roles} onChange={(e) => onDropdownChange(e, 'role')} placeholder="Chọn vai trò" />
                        </div>
                        <div className="field">
                            <label htmlFor="status">Trạng thái</label>
                            <Dropdown id="status" value={account.status} options={statuses} onChange={(e) => onDropdownChange(e, 'status')} placeholder="Chọn trạng thái" />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteAccountDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteAccountDialogFooter} onHide={hideDeleteAccountDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {account && (
                                <span>
                                    Bạn có chắc chắn muốn xóa tài khoản <b>{account.fullName}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default AccountsPage;
