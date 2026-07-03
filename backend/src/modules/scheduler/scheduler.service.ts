import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(
    SchedulerService.name,
  );

  logJobStart(job: string) {
    this.logger.log(
      `Started: ${job}`,
    );
  }

  logJobFinish(job: string) {
    this.logger.log(
      `Completed: ${job}`,
    );
  }

  logJobError(
    job: string,
    error: unknown,
  ) {
    const message =
      error instanceof Error
        ? error.stack ?? error.message
        : String(error);

    this.logger.error(
      `Failed: ${job}`,
      message,
    );
  }
}