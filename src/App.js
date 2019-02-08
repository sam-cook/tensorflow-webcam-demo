import React from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.videoRef = React.createRef();
    this.canvasRef = React.createRef();
    this.state = {
      loadingModel: false,
      seenObjects: {}
    };
  }

  async componentDidMount() {
    if (this.userCanStreamWebcam()) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user"
        }
      });

      this.videoRef.current.srcObject = stream;
      this.videoRef.current.onloadedmetadata = async () => {
        this.setState({ loadingModel: true });
        const model = await cocoSsd.load("lite_mobilenet_v2");
        this.setState({ loadingModel: false });
        this.detectObjectsFromFrame(this.videoRef.current, model);
      };
    }
  }

  userCanStreamWebcam = () =>
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

  detectObjectsFromFrame = async (video, model) => {
    const objects = await model.detect(video);
    this.renderObjectIdentifiers(objects);
    requestAnimationFrame(() => {
      this.detectObjectsFromFrame(video, model);
    });
  };

  addObjectToSeenList = name => {
    const seenObjects = { ...this.state.seenObjects };
    const objectExists = seenObjects[name];

    if (objectExists) {
      seenObjects[name].count = seenObjects[name].count + 1;
    } else {
      seenObjects[name] = {
        count: 1
      };
    }

    this.setState({ seenObjects });
  };

  renderSeenObjectsList = () => {
    const { seenObjects } = this.state;
    const list = Object.keys(seenObjects).map(key => key);

    if (!list.length) return null;
    return (
      <React.Fragment>
        <p>
          <span role="img" aria-label="Eyes Emoji">
            👀
          </span>
          Things I have seen so far...
        </p>
        <ul>
          {list.map(object => (
            <li>{object}</li>
          ))}
        </ul>
      </React.Fragment>
    );
  };

  renderObjectIdentifiers = objects => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    objects.forEach(object => {
      const [x, y, width, height] = object.bbox;

      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "#FF0000";
      const { width: textWidth } = ctx.measureText(object.class);
      const textHeight = 16;

      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
      ctx.fillStyle = "#000000";
      ctx.fillText(object.class, x, y);
      this.addObjectToSeenList(object.class);
    });
  };

  render() {
    return (
      <React.Fragment>
        {this.state.loadingModel && (
          <div>
            <h1>Loading Tensorflow Model, please wait!</h1>
            <p>
              Why not take this time to look at your beautiful face? Thats a
              nice face.
            </p>
          </div>
        )}
        <video
          autoPlay
          ref={this.videoRef}
          playsInline
          muted
          width="600"
          height="500"
        />
        <canvas
          style={{ position: "absolute", top: 0, left: 0 }}
          ref={this.canvasRef}
          width="600"
          height="500"
        />
        {this.renderSeenObjectsList()}
      </React.Fragment>
    );
  }
}
