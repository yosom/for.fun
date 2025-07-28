const { useRef, useMemo, useState, useEffect } = React;
const {DragDropContext, Draggable, Droppable } = window.ReactBeautifulDnd;
const { format, getDate, getHours, getMinutes } = dateFns;

const Other = (time, goodWeather, setGoodWeather) => {
	
	let date = getDate(time);
	//date-fns version 1.3, so be careful with formating
	let dayOfWeek = format(time, 'ddd');
	
	let weather = "";
	const cloudy = "rounded-xl bg-slate-400";
	const sunny = "rounded-[3rem] bg-yellow-400";
	
	goodWeather ? weather = sunny : weather = cloudy;
	
	return (
		<div className="dragExample h-24 w-full grid grid-cols-2 gap-3">
			<div className="w-24 rounded rounded-xl bg-orange-400 text-4xl p-2 flex justify-center flex-col items-start">
				<div>{dayOfWeek}</div>
				<div>{date}</div>
			</div>
			<div className={`rounded ${weather} transition-all duration-300 w-24 h-24 flex justify-center items-center text-4xl place-self-end after:content-['°']`} onClick={() => setGoodWeather((prev) => !prev)}>{goodWeather ? 23 : 16}</div>
		</div>
	);
};

const Time = (time) => {
	
	const minutes = ("0" + getMinutes(time)).slice(-2);
	const hours = ("0" + getHours(time)).slice(-2);
	
	return (
	<div className="rounded rounded-xl h-24 w-52 bg-blue-700 flex justify-center items-center text-6xl">{hours}:{minutes}</div>);
};

const initWidgets = [
	{
		id: 1,
		content: Time
	}, 
	{
		id: 2,
		content: Other
	}
];


const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

function Widget({ widget, index }) {
	const [date, setDate] = useState(new Date());
	const [goodWeather, setGoodWeather] = useState(Math.random() < 0.5);
	
	useEffect(() => {
		setInterval(() => setDate(new Date()), 1000);
	}, []);

	return (
		<Draggable draggableId={widget.id} index={index}>
			{provided => (
				<div className="p-1.5"
					ref={provided.innerRef}
					{...provided.draggableProps}
					{...provided.dragHandleProps}
				>
					{widget.content(date, goodWeather, setGoodWeather)}
				</div>
			)}
		</Draggable>
	);
}



function DragableWidgets() {
  const [state, setState] = useState({ widgets: initWidgets });
	
  function onDragEnd(result) {
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }
    const widgets = reorder(
      state.widgets,
      result.source.index,
      result.destination.index
    );
    setState({ widgets });
  }
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="list">
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps} >
			<Widget widget={state.widgets[0]} index={0} key={state.widgets[0].id} />
			<Widget widget={state.widgets[1]} index={1} key={state.widgets[1].id} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

ReactDOM.render(<DragableWidgets />, document.getElementById('app'))
