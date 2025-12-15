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
    // 1. Try ExchangeRate-API (Open & Reliable for standard usage)
    try {
      this.logger.debug('Fetching rates from ExchangeRate-API...');
      const response = await axios.get<{
        rates: Record<string, number>;
      }>('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 10000,
      });

      if (response.data && response.data.rates) {
        const filtered: Record<string, number> = {};
        for (const currency of this.mpCurrencies) {
          if (response.data.rates[currency]) {
            filtered[currency] = response.data.rates[currency];
          }
        }
        return filtered;
      }
    } catch (err) {
      this.logger.warn(
        'ExchangeRate-API failed, attempting alternative source:',
        err instanceof AxiosError ? err.message : 'Unknown error',
      );
    }

    // 2. Fallback: FreeCurrencyAPI (Requires API Key)
    const apiKey = process.env.FREECURRENCYAPI_KEY;
    if (apiKey) {
      try {
        this.logger.debug('Fetching rates from FreeCurrencyAPI...');
        const response = await axios.get<{ data: Record<string, number> }>(
          'https://api.freecurrencyapi.com/v1/latest',
          {
            params: {
              apikey: apiKey,
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
        this.logger.warn(
          'FreeCurrencyAPI failed:',
          err instanceof AxiosError ? err.message : 'Unknown error',
        );
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
      ARS: 1050, // Updated approximate rate
      BRL: 5.75,
      MXN: 18.5,
      COP: 4100,
      PEN: 3.75,
      CLP: 980,
      UYU: 42,
      VES: 36,
    };

    return fallbackRates[currency] || 1;
  }
}
