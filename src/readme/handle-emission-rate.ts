import { NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES } from 'ngx-sub-form';
import { Observable } from 'rxjs';
import { ListingComponent, OneListingForm } from './listing.component';
import { VehicleListing, DroidListing } from 'src/app/interfaces/listing.interface';

class HandleEmissionRateExample extends ListingComponent {
  public handleEmissionRate(): (
    obs$: Observable<VehicleListing | DroidListing | null>,
  ) => Observable<VehicleListing | DroidListing | null> {
    // debounce by 500ms
    return NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES.debounce(500);
  }
}
