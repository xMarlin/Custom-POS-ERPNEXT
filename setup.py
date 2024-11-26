from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

setup(
	name="custom_pos",
	version="1.0.0",
	description="Custom Point of Sale for ERPNext",
	author="Your Company",
	author_email="info@yourcompany.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)