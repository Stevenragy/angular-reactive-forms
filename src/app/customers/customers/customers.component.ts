import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormGroup,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidatorFn,
  AbstractControlOptions,
} from '@angular/forms';
import { Customer } from './customers';
import { tap } from 'rxjs';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max))
      return { range: true };
    else return null;
  };
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl?.pristine || confirmControl?.pristine) {
    return null;
  }

  if (emailControl?.value === confirmControl?.value) {
    return null;
  }
  return { match: true };
}
@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css',
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;
  customer = new Customer();
  emailErrorMessage!: string;

  private formBuilder = inject(FormBuilder);

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.',
  };

  ngOnInit(): void {
    this.customerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(50)]],
      emailGroup: this.formBuilder.group(
        {
          email: ['', [Validators.required, Validators.email]],
          confirmEmail: ['', Validators.required],
        },
        // as AbstractControlOptions here is to solve deprecation error
        { validator: emailMatcher as AbstractControlOptions }
      ),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
    });

    this.customerForm
      .get('notification')
      ?.valueChanges.subscribe((value) => this.setNotification(value));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.subscribe((value) =>
      this.setEmailErrorMessage(value)
    );
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      secondCatalog: false,
    });
  }

  setNotification(notificationType: string) {
    const phoneControl = this.customerForm.get('phone');
    if (notificationType === 'text') {
      phoneControl?.setValidators(Validators.required);
    } else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity();
  }

  setEmailErrorMessage(c: AbstractControl) {
    this.emailErrorMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailErrorMessage = Object.keys(c.errors)
        .map((key) => (this.validationMessages as any)[key])
        .join(' ');
    }
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }
}
