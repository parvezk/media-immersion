import React from "react";
import ReactDom from "react-dom";
import classnames from "classnames";
import { string, object } from "prop-types";

import * as d3 from "d3";
import { event as currentEvent } from "d3";

import "./styles.scss";
import { setTimeout } from "timers";

const force = d3.layout.force();
let node;
let nodes;

class Landing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      VIDEO: "mosul",
      DEVICE: "samsung",
      vr: false,
      width: 600,
      height: 540,
      force: null
    };
  }

  componentWillMount() {}

  componentDidMount() {
    const { VIDEO, DEVICE, width, height } = this.state;
    //const svg = this.__container;

    const svg = d3
      .select(".container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    this.getPersons();
  }

  componentDidUpdate() {
    const { VIDEO, DEVICE } = this.state;
    const self = this;
    const dataSource = "../../assets/source.json";
    let ds;
    let persons;
    const fill = d3.scale.category10();
    const svg = d3.select("svg");

    console.log(this.state);

    d3.json(dataSource, function(error, source) {
      if (error) {
        console.log(error);
      } else {
        ds = source;

        persons = ds.persons;

        const dataset = self.getDataset(VIDEO, DEVICE, persons);
        const countset = self.getCountset(persons);

        let n = 0;
        Object.values(countset).forEach(e => (n += e));
        //console.log(n);

        nodes = d3.range(n).map(function(i) {
          let obj = {};
          let input = dataset[i];
          const sentiment = Object.keys(input)[0];

          for (let [key, value] of Object.entries(input)) {
            obj[key] = value;
            obj.sentiment = sentiment;
          }
          obj.index = i;
          return obj;
        });

        //console.log(nodes)
        //nodes.splice((0), nodes.length -1);
          
        node = svg.selectAll(".node")
        .data(nodes)
        node.exit().remove();

        force
        .nodes(nodes)
        //.on("tick", self.tick)
        .start();
        
        setTimeout(() => {
          //let node = svg.selectAll("circle").data(nodes).enter();

          node = d3
          .select("svg")
          .selectAll(".node")
          .data(nodes)
          .enter()
          .append("circle")
          .attr("style", "cursor: pointer")
          .attr("class", "node")
          .attr("cx", function(d) {
            return d.x;
          }) //relative position
          .attr("cy", function(d) {
            return d.y;
          }) //relative position
          .attr("r", 8) //radius = size of circle
          .style("fill", function(d) {
            //return fill(i & 3); //random based on color scale above
            return d.sentiment == "restorative"
              ? "#d62728"
              : d.sentiment == "fascination"
                ? "#2ca02c"
                : d.sentiment == "stimulation" ? "#1f77b4" : "#ff7f0e";
          })
          .call(force.drag)
          
          
        }, 2000);

      }
    });
  }

  componentWillUnmount() {
    d3.select("svg").remove();
  }

  getPersons() {
    const dataSource = "../../assets/source.json";
    let ds;
    let persons, totalUsers;
    const self = this;

    d3.json(dataSource, function(error, source) {
      if (error) {
        console.log(error);
      } else {
        ds = source;

        persons = ds.persons;
        totalUsers = Object.keys(persons).length;

        self.forceLayout(persons);
      }
    });
  }

  getPacks(VIDEO, DEVICE, persons) {
    let _packs = [];

    // Filter all persons to pick sentiment data
    // matching [DEVICE][VIDEO]

    Array.from(persons).map(user => {
      const name = user.name;
      const categories = user.categories;

      for (const [key, value] of Object.entries(categories)) {
        if (key == VIDEO) {
          for (const [i, j] of Object.entries(value)) {
            if (i == DEVICE) {
              j.name = name;
              _packs.push(j);
            }
          }
        }
      }
    });

    return _packs;
  }

  getDataset(VIDEO, DEVICE, persons) {
    const _packs = this.getPacks(VIDEO, DEVICE, persons);

    // TEST AGG DATA
    // Cumulative Data Object
    let _CUMULATIVE = [];
    _packs.forEach(data => {
      for (let [key, value] of Object.entries(data)) {
        let obj = {};
        obj[key] = Math.round(Math.cbrt(value));
        obj.name = data.name;
        obj.video = VIDEO;
        obj.device = DEVICE;

        if (typeof value == "number") {
          _CUMULATIVE.push(obj);
        }
      }
    });

    const dataset = [];
    for (let item of Object.values(_CUMULATIVE)) {
      const sentiment = Object.keys(item)[0];
      let m = item[sentiment];
      //console.log(sentiment, item[sentiment])
      for (let i = 0; i < m; i++) {
        dataset.push(item);
      }
    }

    /***************/

    /*************** */

    return dataset;
  }

  getCountset(persons) {
    // Initialize Dataset
    let countset = {};
    const { VIDEO, DEVICE } = this.state;

    const list = Object.values(persons[0].categories)[0];
    const listItems = Object.values(list)[0];
    Object.keys(listItems).forEach(e => {
      if (e !== "name") {
        countset[e] = 0;
      }
    });

    const _packs = this.getPacks(VIDEO, DEVICE, persons);

    _packs.forEach(data => {
      for (let [key, value] of Object.entries(data)) {
        value = Math.round(Math.cbrt(value));

        switch (key) {
          case "restorative": {
            countset.restorative += value;

            break;
          }

          case "fascination": {
            countset.fascination += value;
            break;
          }

          case "stimulation": {
            countset.stimulation += value;
            break;
          }

          case "power": {
            countset.power += value;
            break;
          }
        }
      }
    });

    return countset;
    //return countset;
  }

  forceLayout(persons) {
    
    const { VIDEO, DEVICE, width, height } = this.state;
    const dataset = this.getDataset(VIDEO, DEVICE, persons);
    const countset = this.getCountset(persons);

    let n = 0;
    Object.values(countset).forEach(e => (n += e));
    console.log(n);

    //get colors
    const fill = d3.scale.category10();

    //build a map of 100 nodes
    // combine nodes and CUMULATIVE
    nodes = d3.range(n).map(function(i) {
      let obj = {};
      let input = dataset[i];
      const sentiment = Object.keys(input)[0];

      for (let [key, value] of Object.entries(input)) {
        obj[key] = value;
        obj.sentiment = sentiment;
      }
      obj.index = i;
      return obj;
    });
    console.log(nodes);

    //build our layout
    force
      .nodes(nodes)
      .size([width, height])
      .on("tick", this.tick)
      .start();

    //add the nodes
    node = d3
      .select("svg")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("style", "cursor: pointer")
      .attr("class", "node")
      .attr("cx", function(d) {
        return d.x;
      }) //relative position
      .attr("cy", function(d) {
        return d.y;
      }) //relative position
      .attr("r", 8) //radius = size of circle
      .style("fill", function(d) {
        //return fill(i & 3); //random based on color scale above
        return d.sentiment == "restorative"
          ? "#d62728"
          : d.sentiment == "fascination"
            ? "#2ca02c"
            : d.sentiment == "stimulation" ? "#1f77b4" : "#ff7f0e";
      })
      .style("stroke", function(d, i) {
        return d3.rgb(fill(i & 3)).darker(0);
      })
      .call(force.drag)
      .on("mousedown", function() {
        currentEvent.stopPropagation();
      });

    d3
      .select("svg")
      .style("opacity", 1e-6)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    const mousedown = () => {
      nodes.forEach(function(o) {
        o.x += (Math.random() - 0.5) * 40;
        o.y += (Math.random() - 0.5) * 40;
      });
      force.resume();
    };

    d3.select(".container svg").on("mousedown", mousedown);
  }

  tick = e => {
    // Push different nodes in different directions for clustering.
    const k = 6 * e.alpha;
    nodes.forEach(function(o) {
      switch (o.sentiment) {
        case "restorative": {
          o.y += k;
          o.x += k;
          break;
        }

        case "fascination": {
          o.y += k;
          o.x += -k;
          break;
        }

        case "stimulation": {
          o.y += -k;
          o.x += k;
          break;
        }

        case "power": {
          o.y += -k;
          o.x += -k;
          break;
        }
      }
      //o.y += i & 1 ? k : -k;
      //o.x += i & 2 ? k : -k;
    });

    node
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });
  };

  _onHandleClick = e => {

    const device = e.target.attributes.getNamedItem('data-device').value;
    const video = e.target.attributes.getNamedItem('data-video').value;

    this.setState({
      VIDEO: video,
      DEVICE: device,
      vr: true
    });
  };

  render() {
    return (
      <div className="wrapper">
        <section className="col1">
          <div className="left-box">
            <p className="viz-title">Visualization: Sentiments</p>
            <div>
              <ul>
                <li>
                  <h4>Open-Mindedness</h4>
                  <p>Associated with an individual being attracted to a topic, but not alarmed. A participant exhibits less than 44 percent of the overall range of attention.</p>
                </li>
                <li>
                  <h4>Fascination</h4>
                  <p>Associated with a relaxed interest in a topic. Aparticipant exhibits less than 57 percent of the overall range of attention</p>
                </li>
                <li>
                  <h4>Stimulation</h4>
                  <p>Associated with an individual being more attentive than they are relaxed. Aparticipant exhibits greater than 50 percent of the overall range of attention.</p>
                </li>
                <li>
                  <h4>Power Intensity</h4>
                  <p>Associated with the lasting impact of the experience. A participant exhibits greater than 44 percent of the overall range of attention.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section className="col2">
          <div className="container" />
        </section>
        <section className="col3">
        <a href="#" onClick={this._onHandleClick} data-device="cardboard" data-video="mosul">
          Mosul Cardboard
        </a>
        <br />
        <a href="#" onClick={this._onHandleClick} data-device="samsung" data-video="mosul">
          Mosul Samsung
        </a>
        </section>
      </div>
    );
  }
}

Landing.defaultProps = {
  header: "<header>Base Page</header>"
};

export default Landing;
