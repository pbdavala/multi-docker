import React, { Component } from 'react';
//axios makes requests to backend Express server 
import axios from 'axios';

class Fib extends Component {
  //state object..
  state = {
    seenIndexes: [],
    values: {},
    index: ''
  };

  //std method available 
  componentDidMount() {
    this.fetchValues();
    this.fetchIndexes();
  }

  //Fetch the fib value for the current index from redisClient (server/index.js)
  async fetchValues() {
    const values = await axios.get('/api/values/current');
    this.setState({ values: values.data });
  }

  //Fetch the values for all from pgClient (server/index.js)
  async fetchIndexes() {
    const seenIndexes = await axios.get('/api/values/all');
    this.setState({
      seenIndexes: seenIndexes.data
    });
  }

  handleSubmit = async event => {
    //To makesure form from attempting to submit itself...call preventDefault()
    event.preventDefault();
    //Post an object with index prop. in axios post req
    await axios.post('/api/values', {
      index: this.state.index
    });
    this.setState({ index: '' });
  };

  renderSeenIndexes() {
    //iterate over every object in seenIndexes array and pull & return the number. This is from Postgres
    return this.state.seenIndexes.map(({ number }) => number).join(', ');   //Append , to the number returned.
  }

  //These values are from redis with objects (index:fibValue pairs)
  renderValues() {
    const entries = [];

    for (let key in this.state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {this.state.values[key]}
        </div>
      );
    }

    return entries;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index:</label>
          <input
            value={this.state.index}
            onChange={event => this.setState({ index: event.target.value })}
          />
          <button>Submit</button>
        </form>

        <h3>Indexes I have seen:</h3>
        {this.renderSeenIndexes()}

        <h3>Calculated Values:</h3>
        {this.renderValues()}
      </div>
    );
  }
}

export default Fib;
