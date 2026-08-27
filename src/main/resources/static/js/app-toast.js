/* ==========================================================================
   APP TOAST & MODAL NOTIFICATION SYSTEM
   Replaces all browser native alert() and confirm() dialogs with modern,
   responsive, accessible, and beautifully styled app popups.
   ========================================================================== */

(function () {
    'use strict';

    // Inject styles for toasts and modals if not present
    function injectStyles() {
        if (document.getElementById('app-notification-styles')) return;

        const css = `
            /* Toast Container */
            .app-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 420px;
                width: calc(100% - 48px);
                pointer-events: none;
            }

            .app-toast {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px 20px;
                background: #ffffff;
                color: #1e293b;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                border-left: 5px solid #3b82f6;
                pointer-events: auto;
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .app-toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .app-toast-icon {
                font-size: 1.4rem;
                line-height: 1;
                flex-shrink: 0;
            }

            .app-toast-content {
                flex-grow: 1;
            }

            .app-toast-title {
                font-weight: 600;
                font-size: 0.95rem;
                margin-bottom: 2px;
            }

            .app-toast-message {
                font-size: 0.875rem;
                color: #64748b;
                line-height: 1.4;
            }

            .app-toast-close {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 0;
                font-size: 1.2rem;
                line-height: 1;
                margin-left: 8px;
                transition: color 0.15s ease;
            }

            .app-toast-close:hover {
                color: #334155;
            }

            /* Toast Variants */
            .app-toast.success { border-left-color: #10b981; }
            .app-toast.success .app-toast-icon { color: #10b981; }

            .app-toast.error { border-left-color: #ef4444; }
            .app-toast.error .app-toast-icon { color: #ef4444; }

            .app-toast.warning { border-left-color: #f59e0b; }
            .app-toast.warning .app-toast-icon { color: #f59e0b; }

            .app-toast.info { border-left-color: #3b82f6; }
            .app-toast.info .app-toast-icon { color: #3b82f6; }

            /* Modal Dialog Container */
            .app-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(4px);
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.25s ease;
            }

            .app-modal-backdrop.show {
                opacity: 1;
                visibility: visible;
            }

            .app-modal-card {
                background: #ffffff;
                border-radius: 16px;
                width: 100%;
                max-width: 460px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                transform: scale(0.9);
                opacity: 0;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                overflow: hidden;
            }

            .app-modal-backdrop.show .app-modal-card {
                transform: scale(1);
                opacity: 1;
            }

            .app-modal-header {
                padding: 24px 24px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .app-modal-header-icon {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .app-modal-header-icon.warning { background: #fef3c7; color: #d97706; }
            .app-modal-header-icon.danger { background: #fee2e2; color: #dc2626; }
            .app-modal-header-icon.info { background: #e0e7ff; color: #4f46e5; }
            .app-modal-header-icon.success { background: #d1fae5; color: #059669; }

            .app-modal-title {
                font-size: 1.15rem;
                font-weight: 700;
                color: #0f172a;
                margin: 0;
            }

            .app-modal-body {
                padding: 0 24px 20px;
                color: #475569;
                font-size: 0.95rem;
                line-height: 1.5;
            }

            .app-modal-footer {
                padding: 16px 24px 24px;
                background: #f8fafc;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                border-top: 1px solid #e2e8f0;
            }

            .app-modal-btn {
                padding: 10px 18px;
                font-size: 0.9rem;
                font-weight: 600;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .app-modal-btn-cancel {
                background: #ffffff;
                color: #475569;
                border: 1px solid #cbd5e1;
            }

            .app-modal-btn-cancel:hover {
                background: #f1f5f9;
            }

            .app-modal-btn-confirm {
                background: #4361ee;
                color: #ffffff;
            }

            .app-modal-btn-confirm:hover {
                background: #3730a3;
            }

            .app-modal-btn-danger {
                background: #ef4444;
                color: #ffffff;
            }

            .app-modal-btn-danger:hover {
                background: #b91c1c;
            }

            /* Password Toggle Eye Icon Helper */
            .password-input-group {
                position: relative;
            }

            .password-toggle-btn {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 4px;
                font-size: 1.1rem;
                line-height: 1;
                z-index: 10;
            }

            .password-toggle-btn:hover {
                color: #3b82f6;
            }
        `;

        const styleTag = document.createElement('style');
        styleTag.id = 'app-notification-styles';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }

    // Ensure toast container
    function getToastContainer() {
        let container = document.getElementById('app-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'app-toast-container';
            container.className = 'app-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // AppToast API
    window.AppToast = {
        show: function (message, type = 'info', title = '', duration = 4000) {
            injectStyles();
            const container = getToastContainer();

            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };

            const defaultTitles = {
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Information'
            };

            const toast = document.createElement('div');
            toast.className = `app-toast ${type}`;
            toast.innerHTML = `
                <div class="app-toast-icon">${icons[type] || 'ℹ'}</div>
                <div class="app-toast-content">
                    <div class="app-toast-title">${title || defaultTitles[type] || 'Notice'}</div>
                    <div class="app-toast-message">${message}</div>
                </div>
                <button type="button" class="app-toast-close" aria-label="Close">&times;</button>
            `;

            container.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            // Close handler
            const closeToast = () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 350);
            };

            toast.querySelector('.app-toast-close').addEventListener('click', closeToast);

            if (duration > 0) {
                setTimeout(closeToast, duration);
            }
        },

        success: function (message, title = 'Success', duration = 4000) {
            this.show(message, 'success', title, duration);
        },

        error: function (message, title = 'Error', duration = 5000) {
            this.show(message, 'error', title, duration);
        },

        warning: function (message, title = 'Warning', duration = 4500) {
            this.show(message, 'warning', title, duration);
        },

        info: function (message, title = 'Info', duration = 4000) {
            this.show(message, 'info', title, duration);
        }
    };

    // AppModal Confirmation Dialog API
    window.AppModal = {
        confirm: function ({
            title = 'Confirm Action',
            message = 'Are you sure you want to proceed?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            type = 'warning' // 'warning', 'danger', 'info', 'success'
        }) {
            injectStyles();

            return new Promise((resolve) => {
                const backdrop = document.createElement('div');
                backdrop.className = 'app-modal-backdrop';

                const icons = {
                    warning: '⚠',
                    danger: '🗑',
                    info: 'ℹ',
                    success: '✓'
                };

                const confirmBtnClass = type === 'danger' ? 'app-modal-btn-danger' : 'app-modal-btn-confirm';

                backdrop.innerHTML = `
                    <div class="app-modal-card">
                        <div class="app-modal-header">
                            <div class="app-modal-header-icon ${type}">${icons[type] || 'ℹ'}</div>
                            <h3 class="app-modal-title">${title}</h3>
                        </div>
                        <div class="app-modal-body">
                            ${message}
                        </div>
                        <div class="app-modal-footer">
                            <button type="button" class="app-modal-btn app-modal-btn-cancel">${cancelText}</button>
                            <button type="button" class="app-modal-btn ${confirmBtnClass}">${confirmText}</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(backdrop);

                requestAnimationFrame(() => {
                    backdrop.classList.add('show');
                });

                const close = (result) => {
                    backdrop.classList.remove('show');
                    setTimeout(() => {
                        backdrop.remove();
                        resolve(result);
                    }, 250);
                };

                backdrop.querySelector('.app-modal-btn-cancel').addEventListener('click', () => close(false));
                backdrop.querySelector(`.${confirmBtnClass}`).addEventListener('click', () => close(true));

                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) close(false);
                });
            });
        }
    };

    // Auto-setup Password Show/Hide Toggle on all password fields
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();

        document.querySelectorAll('input[type="password"]').forEach((pwdInput) => {
            if (pwdInput.parentElement.querySelector('.password-toggle-btn')) return;

            pwdInput.parentElement.classList.add('password-input-group');
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle-btn';
            toggleBtn.innerHTML = '👁';
            toggleBtn.title = 'Show/Hide password';

            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isPassword = pwdInput.type === 'password';
                pwdInput.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? '🔒' : '👁';
            });

            pwdInput.parentElement.appendChild(toggleBtn);
        });
    });

})();
