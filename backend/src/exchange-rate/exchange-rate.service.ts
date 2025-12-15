import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  private readonly mpCurrencies = [
    'ARS',
    'BRL',
    'MXN',
    'COP',
    'PEN',
    'CLP',
    'UYU',
    'VES',
  ];

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateExchangeRates(): Promise<void> {
    this.logger.log('Starting daily exchange rate update...');
    try {
      const rates = await this.fetchExchangeRates();
      if (!rates || Object.keys(rates).length === 0) {
        this.logger.warn('No exchange rates fetched');
        return;
      }

      for (const currency of this.mpCurrencies) {
        const rate = rates[currency];
        if (rate) {
          await this.prisma.exchangeRate.upsert({
            where: { currency },
            update: {
              rate,
              updatedAt: new Date(),
            },
            create: {
              currency,
              rate,
              source: 'freecurrencyapi',
            },
          });
          this.logger.debug(`Updated ${currency}: 1 USD = ${rate}`);
        }
      }

      this.logger.log('Exchange rates updated successfully');
    } catch (error) {
      this.logger.error('Failed to update exchange rates:', error);
    }
  }

  private async fetchExchangeRates(): Promise<Record<string, number> | null> {
    try {
      const response = await axios.get<{ data: Record<string, number> }>(
        'https://api.freecurrencyapi.com/v1/latest',
        {
          params: {
            base_currency: 'USD',
            currencies: this.mpCurrencies.join(','),
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      this.logger.debug(
        'Free API failed, attempting alternative source:',
        err instanceof AxiosError ? err.message : 'Unknown error',
      );

      try {
        const fallbackResponse = await axios.get<{
          rates: Record<string, number>;
        }>('https://api.exchangerate-api.com/v4/latest/USD', {
          timeout: 10000,
        });

        if (fallbackResponse.data && fallbackResponse.data.rates) {
          const filtered: Record<string, number> = {};
          for (const currency of this.mpCurrencies) {
            if (fallbackResponse.data.rates[currency]) {
              filtered[currency] = fallbackResponse.data.rates[currency];
            }
          }
          return filtered;
        }
      } catch (fallbackError) {
        this.logger.warn(
          'Fallback API also failed:',
          fallbackError instanceof AxiosError
            ? fallbackError.message
            : 'Unknown error',
        );
        return null;
      }
    }

    return null;
  }

  async getRate(currency: string): Promise<number> {
    const rate = await this.prisma.exchangeRate.findUnique({
      where: { currency },
    });

    if (!rate) {
      this.logger.warn(`Exchange rate for ${currency} not found in database`);
      return this.getFallbackRate(currency);
    }

    return rate.rate;
  }

  async getAllRates(): Promise<Record<string, number>> {
    const rates = await this.prisma.exchangeRate.findMany();
    const result: Record<string, number> = {};

    for (const rate of rates) {
      result[rate.currency] = rate.rate;
    }

    return result;
  }

  private getFallbackRate(currency: string): number {
    const fallbackRates: Record<string, number> = {
      ARS: 1020,
      BRL: 5.25,
      MXN: 17.5,
      COP: 3800,
      PEN: 3.5,
      CLP: 950,
      UYU: 42,
      VES: 36,
    };

    return fallbackRates[currency] || 1;
  }
}
