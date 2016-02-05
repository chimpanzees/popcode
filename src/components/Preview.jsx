var React = require('react');
var Bowser = require('bowser');

var generatePreview = require('../util/generatePreview.js');

var Preview = React.createClass({
  propTypes: {
    project: React.PropTypes.object.isRequired,
    onRuntimeError: React.PropTypes.func.isRequired,
  },

  componentDidMount: function() {
    window.addEventListener('message', this._onMessage);
  },

  componentWillUnmount: function() {
    window.removeEventListener('message', this._onMessage);
  },

  _generateDocument: function() {
    var project = this.props.project;

    if (project === undefined) {
      return '';
    }

    return generatePreview(this.props.project).documentElement.outerHTML;
  },

  _onMessage: function(message) {
    if (typeof message.data !== 'string') {
      return;
    }

    var data;
    try {
      data = JSON.parse(message.data);
    } catch (_e) {
      return;
    }

    if (data.type !== 'org.popcode.error') {
      return;
    }

    this.props.onRuntimeError({
      text: data.error.message,
      raw: data.error.message,
      row: data.error.line - this._runtimeErrorLineOffset() - 1,
      column: data.error.column,
      type: 'error',
    });
  },

  _runtimeErrorLineOffset: function() {
    if (Bowser.safari) {
      return 2;
    }

    var firstSourceLine = this._generateDocument().
      split('\n').indexOf(generatePreview.sourceDelimiter) + 2;

    return firstSourceLine - 1;
  },

  _popOut: function() {
    var doc = this._generateDocument();
    var url = 'data:text/html;base64,' + btoa(doc);
    window.open(url, 'preview');
  },

  _addFrameContents: function(frame) {
    if (frame === null) {
      return;
    }

    var frameDocument = frame.contentDocument;
    frameDocument.open();
    frameDocument.write(this._generateDocument());
    frameDocument.close();
  },

  _buildFrameNode: function() {
    if (Bowser.safari || Bowser.msie) {
      return <iframe className="preview-frame" ref={this._addFrameContents} />;
    }

    return (
      <iframe className="preview-frame" srcDoc={this._generateDocument()} />
    );
  },

  render: function() {
    return (
      <div className="preview">
        <div className="preview-popOutButton" onClick={this._popOut} />
        {this._buildFrameNode()}
      </div>
    );
  },
});

module.exports = Preview;
