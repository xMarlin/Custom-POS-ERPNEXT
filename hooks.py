app_name = "custom_pos"
app_title = "Custom POS"
app_publisher = "Your Company"
app_description = "Custom Point of Sale for ERPNext"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "info@yourcompany.com"
app_license = "MIT"

fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            ["name", "in", [
                "POS Profile-custom_pos_settings"
            ]]
        ]
    }
]

# Include js, css files in header of desk.html
app_include_css = "/assets/custom_pos/css/custom_pos.css"
app_include_js = "/assets/custom_pos/js/custom_pos.js"

# Includes in <head>
# ------------------

# include js, css files in header of web template
# web_include_css = "/assets/custom_pos/css/custom_pos.css"
# web_include_js = "/assets/custom_pos/js/custom_pos.js"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]