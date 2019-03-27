'use strict';

class Clock extends preact.Component {
  constructor () {
    super();
    // set initial time:
    this.state.time = Date.now();
  }

  componentDidMount () {
    // update time every second
    this.timer = setInterval(() => {
      this.setState({ time: Date.now() });
    }, 1000);
  }

  componentWillUnmount () {
    // stop when not renderable
    clearInterval(this.timer);
  }

  handleClick = () => {
    this.props.onClick(`The time is ${new Date(this.state.time).toLocaleTimeString()}!`)
    this.props.alertService.add('success', 'Hello from Preact!', 5000);
  }

  render ({ whoami }, state) {
    let time = new Date(state.time).toLocaleTimeString();
    return (
      <span>
        As far as { whoami } knows, the time is <button onClick={this.handleClick}>{ time }</button>
      </span>
    )
  }
}

angular.module('owm.components')

.directive('preactPoc', function ($state) {
  return {
    restrict: 'E',
    template: `<div class="card mw">
      <div class="card-body">
        <p>Hello <input type="text" ng-model="text" /></p>
        <p class="render-in-here"></p>
        <p ng-if="res">Preact says: <code>{{ res }}</code></p>
      </div>
    </div>`,
    //templateUrl: 'components/rejectionInfoCard.tpl.html',
    controller: function ($scope, $element, alertService) {
      
      $scope.text = 'Preact';

      const el = $element.find(".render-in-here")[0];

      let root
      function render () {
        root = preact.render(
          <Clock
            whoami={$scope.text}
            alertService={alertService}
            onClick={res => $scope.$apply(() => $scope.res = res)}
          />,
          el,
          root
        )
      }

      $scope.$watch('text', render)
      //render()

    },
  };
});
