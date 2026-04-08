import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

type DateMode = 'date' | 'week' | 'month' | 'quarter' | 'year';
type PickerSize = 'large' | 'default' | 'small';
type NzVariant = 'outlined' | 'borderless' | 'filled';
type DropdownPosition = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NzDatePickerModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy, OnChanges
{
  // --- Picker mode & type ---
  @Input() mode: DateMode = 'date';
  @Input() isRange = false;
  @Input() showTime = false;
  @Input() inline = false;

  // --- Appearance ---
  @Input() disabled = false;
  @Input() bordered = true;
  @Input() size: PickerSize = 'default';
  @Input() placeholder = 'Chọn ngày';
  @Input() rangePlaceholder: [string, string] = ['Ngày bắt đầu', 'Ngày kết thúc'];
  @Input() format = 'dd/MM/yyyy';
  @Input() width = '100%';
  @Input() height = '36px';
  @Input() allowClear = true;
  @Input() inputReadOnly = true;
  @Input() popupClassName = '';
  @Input() dropdownPosition: DropdownPosition = 'bottomLeft';
  @Input() disabledDate: (current: Date) => boolean = () => false;

  // --- Outputs ---
  @Output() dateChange = new EventEmitter<Date | null>();
  @Output() rangeChange = new EventEmitter<[Date, Date] | null>();
  @Output() openChange = new EventEmitter<boolean>();

  // --- Internal state ---
  selectedDate: Date | null = null;
  selectedRange: [Date, Date] | null = null;

  get fullFormat(): string {
    if (this.showTime && !this.format.includes('HH')) {
      return `${this.format} HH:mm:ss`;
    }
    return this.format;
  }

  get nzVariant(): NzVariant {
    return this.bordered ? 'outlined' : 'borderless';
  }

  // --- ControlValueAccessor ---
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (this.isRange) {
      this.selectedRange = this.parseRangeValue(value);
    } else {
      this.selectedDate = this.parseDateValue(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // --- Event handlers ---
  onDateChange(date: Date | null): void {
    this.selectedDate = date;
    this.onChange(date);
    this.onTouched();
    this.dateChange.emit(date);
  }

  onRangeChange(dates: [Date, Date] | null): void {
    this.selectedRange = dates;
    this.onChange(dates);
    this.onTouched();
    this.rangeChange.emit(dates);
  }

  onOpenChange(open: boolean): void {
    if (!open) {
      this.onTouched();
    }
    this.openChange.emit(open);
  }

  onPanelChange(_event: any): void {
    // No-op, can be extended
  }

  onOk(_event: any): void {
    // No-op, can be extended
  }

  // --- Input parsing ---
  ngOnChanges(changes: SimpleChanges): void {
    // Accept external value/rangeValue @Input changes if needed
  }

  private parseDateValue(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') return this.parseStringToDate(value);
    return null;
  }

  private parseRangeValue(value: any): [Date, Date] | null {
    if (!value || !Array.isArray(value) || value.length < 2) return null;
    const start = this.parseDateValue(value[0]);
    const end = this.parseDateValue(value[1]);
    if (start && end) return [start, end];
    return null;
  }

  private parseStringToDate(str: string): Date | null {
    if (!str || !str.trim()) return null;
    const trimmed = str.trim();

    // DD/MM/YYYY
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match1 = trimmed.match(ddmmyyyy);
    if (match1) {
      const d = new Date(+match1[3], +match1[2] - 1, +match1[1]);
      return isNaN(d.getTime()) ? null : d;
    }

    // YYYY-MM-DD
    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match2 = trimmed.match(yyyymmdd);
    if (match2) {
      const d = new Date(+match2[1], +match2[2] - 1, +match2[3]);
      return isNaN(d.getTime()) ? null : d;
    }

    // Fallback: try native parse
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // --- Keyboard filtering for manual input ---
  private inputListeners: (() => void)[] = [];

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.attachInputListeners();
  }

  ngOnDestroy(): void {
    this.detachInputListeners();
  }

  private attachInputListeners(): void {
    const inputs: HTMLInputElement[] = Array.from(
      this.elementRef.nativeElement.querySelectorAll('input')
    );
    for (const input of inputs) {
      const keydownHandler = (e: KeyboardEvent) => this.onInputKeydown(e);
      const pasteHandler = (e: ClipboardEvent) => this.onInputPaste(e);
      const inputHandler = (e: Event) => this.onInputAutoSeparator(e as InputEvent, input);

      input.addEventListener('keydown', keydownHandler);
      input.addEventListener('paste', pasteHandler);
      input.addEventListener('input', inputHandler);

      this.inputListeners.push(
        () => input.removeEventListener('keydown', keydownHandler),
        () => input.removeEventListener('paste', pasteHandler),
        () => input.removeEventListener('input', inputHandler)
      );
    }
  }

  private detachInputListeners(): void {
    this.inputListeners.forEach((remove) => remove());
    this.inputListeners = [];
  }

  private onInputKeydown(e: KeyboardEvent): void {
    // Allow: digits, date separators, control keys, Ctrl combos
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
    ];
    if (allowedKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (/^[0-9]$/.test(e.key)) return;
    if (/^[/\-:. ]$/.test(e.key)) return;

    // Block everything else (letters, symbols, etc.)
    e.preventDefault();
  }

  private onInputPaste(e: ClipboardEvent): void {
    const pasted = e.clipboardData?.getData('text') || '';
    if (!/^[\d/\-:. ]+$/.test(pasted)) {
      e.preventDefault();
    }
  }

  private onInputAutoSeparator(e: InputEvent, input: HTMLInputElement): void {
    // Auto-insert separator based on format
    const val = input.value;
    const sep = this.getFormatSeparator();
    if (!sep) return;

    // After 2 digits for day, after 5 for month, auto-insert separator
    if (e.inputType === 'insertText' && /^\d$/.test(e.data || '')) {
      if (val.length === 2 || val.length === 5) {
        input.value = val + sep;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  private getFormatSeparator(): string | null {
    const sepMatch = this.format.match(/[^a-zA-Z]/);
    return sepMatch ? sepMatch[0] : null;
  }
}
