  import { Component, OnInit } from '@angular/core';
  import { ProductService } from '../services/product.service';
  import { Router } from '@angular/router';

  @Component({
    selector: 'app-all-product-scr',
    templateUrl: './all-product-scr.component.html',
    styleUrls: ['./all-product-scr.component.css'],
  })
  export class AllProductScrComponent implements OnInit {
    productType: any[] = [];
    seachedproducts: any[] = [];
    searchTerm: string = '';
    currentPage: number = 1;
    totalPages: number = 1;

    constructor(private services: ProductService, private router: Router) {}

    ngOnInit(): void {
      this.getAllwithall();
    }

    goToPage(page: number) {
      this.currentPage = page;
      this.getAllwithall();
    }

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.getAllwithall();
      }
    }

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.getAllwithall();
      }
    }

    getAllwithall() {
      this.services.findProductsByProductKind({}, this.currentPage).subscribe(
        (response) => {
          console.log(`Successfully fetched paginated products`, response);
          this.productType = response.data.map((item: any) => item.productKind);
          this.totalPages = response.totalPages;
        },
        (error) => {
          console.error('Error fetching paginated product types:', error);
        }
      );
    }
    onSearch() {
      const trimmedTerm = this.searchTerm.trim();
      const isNumeric = /^\d+$/.test(trimmedTerm);
      const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Orange'];
      const sizes = ['S', 'M', 'L', 'XL'];

      const containsSize = sizes.some((size) => trimmedTerm.includes(size));
      const containsColor = colors.some((color) => trimmedTerm.includes(color));

      let searchParams: any = {};

      if (trimmedTerm) {
        if (isNumeric) {
          searchParams = { id: trimmedTerm };
        } else if (containsColor) {
          searchParams = { colors: trimmedTerm };
        } else if (containsSize) {
          searchParams = { size: trimmedTerm };
        } else {
          this.searchByProductypeAndSku(trimmedTerm);
          return;
        }
      }

      this.services
        .findProductsByProductKind(searchParams, this.currentPage)
        .subscribe(
          (response) => {
            this.handleResponseData(response);
          },
          (error) => {
            console.error('Error fetching products:', error);
          }
        );
    }

    private searchByProductypeAndSku(term: string) {
      const productypeSearch = this.services.findProductsByProductKind(
        { productype: term },
        this.currentPage
      );
      const skuSearch = this.services.findProductsByProductKind(
        { sku: term },
        this.currentPage
      );

      Promise.all([productypeSearch.toPromise(), skuSearch.toPromise()])
        .then(([productypeData, skuData]) => {
          const combinedData = [
            ...(productypeData?.data || []),
            ...(skuData?.data || []),
          ];
          const uniqueData = Array.from(
            new Map(combinedData.map((item: any) => [item.id, item])).values()
          );

          this.productType = uniqueData.map((item: any) => item.productKind);
          this.totalPages = Math.max(
            productypeData?.totalPages || 0,
            skuData?.totalPages || 0
          );
        })
        .catch((error) => {
          console.error(
            'Error fetching products by productype and SKU:',
            error
          );
        });
    }

    private handleResponseData(response: any) {
      this.productType = response.data.map((item: any) => item.productKind);
      this.totalPages = response.totalPages;
    }
    goToProductDetail(productId: number) {
      this.router.navigate(['/detail', productId]);
    }

    exportProductData() {
      this.services.exportProductData();
    }

    onFileSelected(event: any) {
      const file = event.target.files[0];

      // Check if a file is selected
      if (file) {
        // Show a loading indicator or disable the button if needed
        // Disable the upload button or show loading state here if required

        // Call the import service
        this.services.importProductData(file).subscribe(
          (response) => {
            alert('Data imported successfully');

            // Optionally, handle the response here (e.g., reset form, refresh data)
          },
          (error) => {
            // Improved error handling
            if (error.status === 400) {
              alert('Product data sheet not found in the Excel file.');
            } else if (error.status === 500) {
              alert(
                'Server error while importing data. Please try again later.'
              );
            } else {
              alert(
                'Error importing data: ' + (error.message || 'Unknown error')
              );
            }
          }
        );
      } else {
        alert('Please select a file first');
      }
    }
  }
