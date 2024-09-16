import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate'
})
export class IhmFormatDatePipe implements PipeTransform{
    transform(date: Date, format: string = "dd/MM/yyyy") : string {
        return formatDate(date, format, "en-US");
    }
}