import frappe
from frappe import _
from erpnext.stock.get_item_details import get_item_details
from erpnext.accounts.doctype.sales_invoice.sales_invoice import get_bank_cash_account
from erpnext.stock.doctype.batch.batch import get_batch_qty
from datetime import datetime, timedelta

@frappe.whitelist()
def get_items(start=0, page_length=40, price_list=None, item_group=None, search_value="", pos_profile=None):
    data = frappe.db.sql("""
        SELECT
            i.name as item_code,
            i.item_name,
            i.description,
            i.stock_uom,
            i.image,
            b.actual_qty as stock_qty,
            ip.price_list_rate
        FROM
            `tabItem` i
        LEFT JOIN
            `tabBin` b ON b.item_code = i.name
        LEFT JOIN
            `tabItem Price` ip ON ip.item_code = i.name
        WHERE
            i.disabled = 0
            AND i.has_variants = 0
            AND i.is_sales_item = 1
            AND (i.name LIKE %(txt)s OR i.item_name LIKE %(txt)s)
            {item_group_condition}
        LIMIT {start}, {page_length}
    """.format(
        start=start,
        page_length=page_length,
        item_group_condition=f"AND i.item_group = '{item_group}'" if item_group else ""
    ),
    {
        'txt': '%%%s%%' % search_value
    }, as_dict=1)

    return data

@frappe.whitelist()
def create_sales_invoice(pos_profile, items, customer, payments, sales_person=None, discount_amount=0, discount_percentage=0, is_return=0, return_against=None):
    try:
        pos_profile = frappe.get_doc("POS Profile", pos_profile)
        si = frappe.new_doc("Sales Invoice")
        si.is_pos = 1
        si.pos_profile = pos_profile.name
        si.customer = customer
        
        if is_return:
            if not return_against:
                frappe.throw(_("Return Against invoice is required for returns"))
            si.is_return = 1
            si.return_against = return_against
            
        if sales_person:
            si.sales_team = [{
                "sales_person": sales_person,
                "allocated_percentage": 100
            }]
        
        # Add items
        for item in items:
            si.append("items", {
                "item_code": item.get("item_code"),
                "qty": item.get("qty") * (-1 if is_return else 1),
                "rate": item.get("rate"),
                "serial_no": item.get("serial_no"),
                "batch_no": item.get("batch_no")
            })
        
        # Apply discounts
        if discount_percentage:
            si.additional_discount_percentage = float(discount_percentage)
        elif discount_amount:
            si.discount_amount = float(discount_amount)
        
        # Add payments
        for payment in payments:
            si.append("payments", {
                "mode_of_payment": payment.get("mode"),
                "amount": payment.get("amount")
            })
        
        si.insert()
        si.submit()
        
        return {
            "success": True,
            "name": si.name,
            "message": "Sales Invoice Created Successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

@frappe.whitelist()
def get_invoice_for_return(invoice_no):
    """Get invoice details for return"""
    try:
        invoice = frappe.get_doc("Sales Invoice", invoice_no)
        settings = frappe.get_single("POS Settings")
        
        if not settings.enable_returns:
            frappe.throw(_("Returns are not enabled in POS Settings"))
            
        days_diff = (datetime.now() - invoice.posting_date).days
        if days_diff > settings.return_within_days:
            frappe.throw(_("Cannot return invoice older than {} days").format(settings.return_within_days))
            
        return {
            "success": True,
            "invoice": invoice.as_dict()
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

@frappe.whitelist()
def get_available_payment_methods(pos_profile):
    """Get available payment methods for POS Profile"""
    profile = frappe.get_doc("POS Profile", pos_profile)
    return [p.payment_method for p in profile.payment_methods if p.enabled]