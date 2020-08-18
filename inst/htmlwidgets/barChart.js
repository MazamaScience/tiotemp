HTMLWidgets.widget({

  name: 'barChart',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {

        // TODO: code to render the widget, e.g.
         //el.innerText = x.message;

        	TESTER = document.getElementById(el.id);
          var data = [
            {
              x: ['giraffes', 'orangutans', 'monkeys'],
              y: [20, 14, 23],
              type: 'bar'
            }
];

Plotly.newPlot(TESTER, data);

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});
