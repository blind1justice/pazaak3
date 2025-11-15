import { FormControl } from '@angular/forms';

export interface ICreateGameForm {
  roomNumber: FormControl<string>;
  bid: FormControl<number>;
}
