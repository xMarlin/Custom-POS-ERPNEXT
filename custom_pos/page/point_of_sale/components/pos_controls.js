erpnext.PointOfSale.PosControls = class PosControls {
    constructor({ wrapper, pos_controller }) {
        this.wrapper = wrapper;
        this.pos_controller = pos_controller;
        this.init_controls();
    }

    init_controls() {
        this.get_pos_settings().then(() => {
            this.make_dom();
            this.bind_events();
        });
    }

    async get_pos_settings() {
        const settings = await frappe.db.get_doc('POS Settings');
        this.settings = settings;
    }

    make_dom() {
        this.wrapper.html(`
            <div class="pos-controls">
                ${this.settings.enable_sales_person ? this.get_sales_person_html() : ''}
                ${this.settings.enable_discounts ? this.get_discount_html() : ''}
            </div>
        `);
    }

    get_sales_person_html() {
        return `
            <div class="sales-person-section">
                <label>Sales Person</label>
                <div class="sales-person-field"></div>
            </div>
        `;
    }

    get_discount_html() {
        return `
            <div class="discount-section">
                ${this.settings.allow_percentage_discount ? `
                    <div class="discount-percent">
                        <label>Discount %</label>
                        <input type="number" 
                               class="form-control discount-percentage-input" 
                               max="${this.settings.max_discount_percentage}">
                    </div>
                ` : ''}
                ${this.settings.allow_amount_discount ? `
                    <div class="discount-amount">
                        <label>Discount Amount</label>
                        <input type="number" 
                               class="form-control discount-amount-input"
                               max="${this.settings.max_discount_amount}">
                    </div>
                ` : ''}
            </div>
        `;
    }

    bind_events() {
        if (this.settings.enable_sales_person) {
            this.setup_sales_person_field();
        }
        if (this.settings.enable_discounts) {
            this.setup_discount_fields();
        }
    }

    setup_sales_person_field() {
        this.sales_person_field = frappe.ui.form.make_control({
            parent: this.wrapper.find('.sales-person-field'),
            df: {
                fieldtype: 'Link',
                options: 'Sales Person',
                fieldname: 'sales_person',
                placeholder: 'Select Sales Person',
                change: () => {
                    this.pos_controller.update_sales_person(this.sales_person_field.get_value());
                }
            }
        });
        this.sales_person_field.make_input();
    }

    setup_discount_fields() {
        if (this.settings.allow_percentage_discount) {
            this.wrapper.find('.discount-percentage-input').on('change', (e) => {
                const value = parseFloat(e.target.value);
                if (value > this.settings.max_discount_percentage) {
                    frappe.throw(__(`Discount percentage cannot exceed ${this.settings.max_discount_percentage}%`));
                    e.target.value = 0;
                    return;
                }
                this.pos_controller.apply_discount('percentage', value);
            });
        }

        if (this.settings.allow_amount_discount) {
            this.wrapper.find('.discount-amount-input').on('change', (e) => {
                const value = parseFloat(e.target.value);
                if (value > this.settings.max_discount_amount) {
                    frappe.throw(__(`Discount amount cannot exceed ${format_currency(this.settings.max_discount_amount)}`));
                    e.target.value = 0;
                    return;
                }
                this.pos_controller.apply_discount('amount', value);
            });
        }
    }
}