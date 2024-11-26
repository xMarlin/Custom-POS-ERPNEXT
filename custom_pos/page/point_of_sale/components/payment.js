erpnext.PointOfSale.Payment = class Payment {
    constructor({ wrapper, pos_controller }) {
        this.wrapper = wrapper;
        this.pos_controller = pos_controller;
        this.init_component();
    }

    init_component() {
        this.prepare_dom();
        this.bind_events();
        this.load_payment_methods();
    }

    prepare_dom() {
        this.wrapper.html(`
            <div class="payment-container">
                <div class="payment-modes"></div>
                <div class="payment-summary">
                    <div class="total-amount"></div>
                    <div class="paid-amount"></div>
                    <div class="balance"></div>
                </div>
                <div class="payment-actions">
                    <button class="btn btn-primary complete-pay-btn">Complete Payment</button>
                    <button class="btn btn-default new-return-btn">New Return</button>
                </div>
            </div>
        `);
    }

    async load_payment_methods() {
        const methods = await frappe.call({
            method: 'custom_pos.api.get_available_payment_methods',
            args: { pos_profile: this.pos_controller.pos_profile }
        });

        this.render_payment_methods(methods.message || []);
    }

    render_payment_methods(methods) {
        const container = this.wrapper.find('.payment-modes');
        methods.forEach(method => {
            const btn = $(`
                <div class="payment-mode-btn" data-mode="${method}">
                    <span>${method}</span>
                </div>
            `);
            container.append(btn);
        });
    }

    bind_events() {
        this.wrapper.on('click', '.payment-mode-btn', (e) => {
            const mode = $(e.currentTarget).data('mode');
            this.handle_payment_mode(mode);
        });

        this.wrapper.on('click', '.new-return-btn', () => {
            this.show_return_dialog();
        });
    }

    handle_payment_mode(mode) {
        // Handle different payment modes (Cash, Card, etc.)
        const amount = this.get_remaining_amount();
        if (mode === 'Cash') {
            this.show_cash_modal(amount);
        } else if (mode === 'Card') {
            this.show_card_modal(amount);
        }
    }

    show_cash_modal(amount) {
        const dialog = new frappe.ui.Dialog({
            title: __('Cash Payment'),
            fields: [
                {
                    fieldname: 'amount_tendered',
                    label: __('Amount Tendered'),
                    fieldtype: 'Currency',
                    default: amount
                }
            ],
            primary_action: ({ amount_tendered }) => {
                this.add_payment('Cash', amount_tendered);
                dialog.hide();
            }
        });
        dialog.show();
    }

    show_card_modal(amount) {
        const dialog = new frappe.ui.Dialog({
            title: __('Card Payment'),
            fields: [
                {
                    fieldname: 'card_number',
                    label: __('Card Number'),
                    fieldtype: 'Data',
                    mask: '#### #### #### ####'
                },
                {
                    fieldname: 'amount',
                    label: __('Amount'),
                    fieldtype: 'Currency',
                    default: amount
                }
            ],
            primary_action: (values) => {
                this.add_payment('Card', values.amount);
                dialog.hide();
            }
        });
        dialog.show();
    }

    show_return_dialog() {
        const dialog = new frappe.ui.Dialog({
            title: __('Return Invoice'),
            fields: [
                {
                    fieldname: 'invoice_no',
                    label: __('Original Invoice No'),
                    fieldtype: 'Link',
                    options: 'Sales Invoice',
                    reqd: 1
                }
            ],
            primary_action: async ({ invoice_no }) => {
                const result = await frappe.call({
                    method: 'custom_pos.api.get_invoice_for_return',
                    args: { invoice_no }
                });
                
                if (result.message.success) {
                    this.pos_controller.load_return_invoice(result.message.invoice);
                    dialog.hide();
                } else {
                    frappe.throw(result.message.message);
                }
            }
        });
        dialog.show();
    }
}