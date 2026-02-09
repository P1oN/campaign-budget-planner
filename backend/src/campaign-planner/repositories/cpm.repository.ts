import { Injectable } from '@nestjs/common';
import { ChannelCpmMap } from '../domain/channel.types';

@Injectable()
export class CpmRepository {
  private readonly defaults: ChannelCpmMap = {
    video: 12,
    display: 6,
    social: 4
  };

  getDefaults(): ChannelCpmMap {
    return { ...this.defaults };
  }
}
