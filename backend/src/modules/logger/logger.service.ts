import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends Logger {

  logInfo(message: string, context?: string) {
    super.log(message, context);
  }

  logWarning(message: string, context?: string) {
    super.warn(message, context);
  }

  logError(
    message: string,
    trace?: string,
    context?: string,
  ) {
    super.error(message, trace, context);
  }

  logDebug(message: string, context?: string) {
    super.debug(message, context);
  }

  logVerbose(message: string, context?: string) {
    super.verbose(message, context);
  }

}