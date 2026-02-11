import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AddressInfo } from 'node:net';
import * as http from 'node:http';
import { AppModule } from '../../app.module';

interface HttpResponse<T = unknown> {
  statusCode: number;
  body: T;
}

function postJson<TResponse>(port: number, path: string, payload: unknown): Promise<HttpResponse<TResponse>> {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({
            statusCode: res.statusCode ?? 0,
            body: parsed
          });
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('Campaign planner HTTP validation', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    await app.listen(0);
    port = (app.getHttpServer().address() as AddressInfo).port;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects decimal duration for /api/plan', async () => {
    const response = await postJson(port, '/api/plan', {
      totalBudget: 1000,
      durationDays: 1.5,
      strategy: 'balanced'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('rejects custom strategy without customMix at DTO level', async () => {
    const response = await postJson(port, '/api/plan', {
      totalBudget: 1000,
      durationDays: 30,
      strategy: 'custom'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('rejects unknown request properties', async () => {
    const response = await postJson(port, '/api/plan', {
      totalBudget: 1000,
      durationDays: 30,
      strategy: 'balanced',
      extraField: true
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('rejects decimal duration for /api/compare', async () => {
    const response = await postJson(port, '/api/compare', {
      totalBudget: 1000,
      durationDays: 2.75
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
