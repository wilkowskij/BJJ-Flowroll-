import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import {
  ValidationPipe,
  HttpException,
  HttpStatus,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common'
import * as express from 'express'
import helmet from 'helmet'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error'

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'object' ? ((message as any).message ?? message) : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  })

  // Raw body parsing for Stripe webhooks — must be registered before global JSON parsing
  app.use('/api/v1/subscription/stripe-webhook', express.raw({ type: 'application/json' }))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.use(helmet())
  app.enableCors({ origin: process.env.PORTAL_ORIGIN || '*', credentials: true })

  app.useGlobalFilters(new GlobalExceptionFilter())

  // Health endpoint — no auth required
  const httpAdapter = app.getHttpAdapter()
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FlowMat API')
    .setDescription('FlowMat BJJ SaaS — Instructor Portal + Student App API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`FlowMat API listening on port ${port}`)
}

bootstrap()
