frappe.pages['point-of-sale'].on_page_load = function(wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: __('Point of Sale'),
        single_column: true
    });

    frappe.require('point_of_sale.bundle.js', function() {
        wrapper.pos = new erpnext.PointOfSale.Controller(wrapper);
    });
};

erpnext.PointOfSale.Controller = class PointOfSale {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.page = wrapper.page;
        this.setup_page_actions();
        this.init_components();
    }

    setup_page_actions() {
        this.page.clear_actions();
        this.page.clear_menu();
        this.page.add_action({
            label: __('New Sale'),
            click: () => this.new_sale()
        });
    }

    init_components() {
        this.init_pos_controls();
        this.init_item_selector();
        this.init_item_cart();
        this.init_payments();
    }

    init_pos_controls() {
        this.pos_controls = new erpnext.PointOfSale.PosControls({
            wrapper: this.wrapper.find('.pos-controls'),
            pos_controller: this
        });
    }

    init_item_selector() {
        this.item_selector = new erpnext.PointOfSale.ItemSelector({
            wrapper: this.wrapper.find('.item-selector'),
            pos_controller: this
        });
    }

    init_item_cart() {
        this.cart = new erpnext.PointOfSale.ItemCart({
            wrapper: this.wrapper.find('.pos-cart'),
            pos_controller: this
        });
    }

    init_payments() {
        this.payment = new erpnext.PointOfSale.Payment({
            wrapper: this.wrapper.find('.payment-section'),
            pos_controller: this
        });
    }

    update_sales_person(sales_person) {
        this.sales_person = sales_person;
        this.cart.update_sales_person(sales_person);
    }

    apply_discount(type, value) {
        this.cart.apply_discount(type, value);
    }

    new_sale() {
        this.cart.clear_cart();
        this.payment.reset_payment();
        if (this.pos_controls) {
            this.pos_controls.reset_controls();
        }
    }
};