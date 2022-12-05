type Topic = {
  token: string;
  fn: Function;
};
export class PubSub {
  topics: Record<string, Array<Topic>>;
  subUid: number;
  constructor() {
    this.topics = {};
    this.subUid = -1;
  }

  subscribe(topic: string, fn: Function) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }

    const token = (++this.subUid).toString();

    this.topics[topic].push({
      token,
      fn,
    });

    return token;
  }

  unSubscribe(token: string) {
    for (let tk in this.topics) {
      for (let i = 0; i < this.topics[tk].length; i++) {
        if (this.topics[tk][i].token === token) {
          this.topics[tk].splice(i, 1);
          return token;
        }
      }
    }
  }

  publish(topic: string, value: any) {
    if (!this.topics[topic]) {
      return;
    }

    this.topics[topic].forEach((sb) => {
      sb.fn(value);
    });
  }
}
