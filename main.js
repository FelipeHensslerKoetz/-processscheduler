/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const readline = require('readline-sync');
const MAX_PROCESSES = 10;
const MAX_TIME_UNITYS = 80;
let executionHistory = [];
let userInput = 0;

/**
 *  Prints the menu on the terminal.
 */
function printMenu() {
  console.clear();
  console.log('### Process Scheduler Simulator ###');
  console.log();
  console.log('1 - FIFO');
  console.log('2 - Round-Robin');
  console.log('3 - SJF');
  console.log('4 - Priority (FIFO)');
  console.log('Negative to exit');
  console.log();
}

/**
 *  Read the user's input processes
 */
async function readInputProcesses() {
  return new Promise((resolve, reject) => {
    console.clear();
    const processes = [];
    let totalUnitysCounter = 0;
    let userResponse = '';

    do {
      console.clear();
      const process = {
        'name': null,
        'arrivalTime': null,
        'priority': null,
        'cycleDuration': null,
        'remainingExecutionTime': null,
        'type': null,
      };

      process.name = readline.question('Name: ');
      process.type = readline.question('Type(cpu/io): ');

      while (process.arrivalTime == null) {
        try {
          process.arrivalTime = parseInt(readline.question('Arrival instant (number): '));
          if (process.arrivalTime < 0) {
            console.log('Arrival time must be positive.');
            throw Error('');
          }
        } catch (error) {
          process.arrivalTime = null;
        }
      }

      while (process.priority == null) {
        try {
          process.priority = parseInt(readline.question('Priority (>=0): '));
          if (process.priority < 0) {
            console.log('Priority must be greater or equal to 0!');
            throw Error('');
          }
        } catch (error) {
          process.priority = null;
        }
      }

      while (process.cycleDuration == null) {
        const reamainingTimeUnitys = MAX_TIME_UNITYS - totalUnitysCounter;
        try {
          process.cycleDuration = parseInt(readline.question(`Cycle duration (remaining  ${reamainingTimeUnitys}): `));
          if (process.cycleDuration > reamainingTimeUnitys || process.cycleDuration <= 0) {
            console.log(`Insert a valid cycle duration (positive and less than or equal to ${reamainingTimeUnitys})`);
            throw Error('');
          }
          totalUnitysCounter += process.cycleDuration;
        } catch (error) {
          process.cycleDuration = null;
        }
      }

      process.remainingExecutionTime = process.cycleDuration;
      processes.push(process);

      console.clear();
      if (processes.length == MAX_PROCESSES ||
         totalUnitysCounter == MAX_TIME_UNITYS) {
        break;
      } else {
        userResponse = readline.question('Create another process? (y/n): ');
      }
    } while (userResponse != 'n');
    resolve(processes);
  });
}

/**
 *  Start the processing based on the user choice.
 * @param {*} userInput
 * @param {*} processes
 */
async function startProcessing(userInput, processes) {
  return new Promise(async (resolve, reject) => {
    let result;
    switch (userInput) {
      case 1:
        result = await fifoProcessing(processes);
        break;
      case 2:
        result = await roundRobin(processes);
        break;
      case 3:
        result = await sjfProcessing(processes);
        break;
      case 4:
        result = await priorityProcessing(processes);
        break;
      default:
        break;
    }
    console.log(result);
    console.log();
    readline.question('Press any key to continue...');
    resolve(true);
  });
}

/**
 * Main loop, keeps running until the user decides to exit.
 */
async function main() {
  while (userInput >= 0) {
    printMenu();
    do {
      try {
        userInput = parseInt(readline.question('Choose an option: '));
        if (userInput > 4) {
          throw Error('');
        }
      } catch (error) {
        console.log('Insert a valid number...');
      }
    } while (!Number.isInteger(userInput));

    if (userInput < 0) {
      break;
    }

    const processes = await readInputProcesses();


    await startProcessing(userInput, processes);

    userInput = 0;
    executionHistory = [];
  }
  console.log('Good Bye');
}

/**
 * Start the FIFO processing simulation.
 * @param {*} processes
 * @return {*} adsda
 */
async function fifoProcessing(processes) {
  return new Promise((resolve, reject) => {
    let isCpuFree = true;
    const fitProcessQueue = [];
    const processUsingCpu = [];
    let internalTimeCounter = -1;
    let processesParameter = processes;

    const incrementTimeCounter = setInterval(function() {
      internalTimeCounter = internalTimeCounter + 1;
    }, 1000);

    const insertProcessIntoFitProcessQueue = setInterval(function() {
      for (let i = 0; i < processesParameter.length; i++) {
        if (processesParameter[i].arrivalTime == internalTimeCounter) {
          fitProcessQueue.push(processesParameter[i]);
          delete processesParameter[i];
        }
      }
      const temp = processesParameter.filter(function(el) {
        return el != null;
      });
      processesParameter = temp;
    }, 1000);

    const tryToUseCpu = setInterval(function() {
      if (isCpuFree && fitProcessQueue.length > 0) {
        isCpuFree = false;
        processUsingCpu.push(fitProcessQueue.shift());
        executionHistory.push({'name': processUsingCpu[0].name,
          'execution': [internalTimeCounter,
            (internalTimeCounter + processUsingCpu[0].cycleDuration)]});
        processUsingCpu[0].remainingExecutionTime =
        processUsingCpu[0].remainingExecutionTime -
        processUsingCpu[0].cycleDuration;
        setTimeout(function() {
          if (processUsingCpu[0].remainingExecutionTime == 0) {
            processUsingCpu.shift();
          } else {
            fitProcessQueue.push(processUsingCpu.shift());
          }
          isCpuFree = true;
        }, processUsingCpu[0].cycleDuration * 1000);
      }
    }, 1000);

    const printRealTime = setInterval(function() {
      console.clear();
      console.log('| FIFO |');
      console.log();
      console.log('=> Raw: ' + joinArrayWithComma(processesParameter));
      console.log('=> Fit queue: ' + joinArrayWithComma(fitProcessQueue));
      console.log('=> CPU: ' + joinArrayWithComma(processUsingCpu));
      console.log();
    }, 1000);

    const checkIfWorkIsCompleted = setInterval(function() {
      if (fitProcessQueue.length == 0 &&
        processesParameter.length == 0 &&
                processUsingCpu.length == 0 &&
                isCpuFree) {
        resolve(executionHistory);
      }
    }, 1000);
  });
}

/**
 * Starts the SJF processing simulation.
 * @param {*} processes
 * @return {*}
 */
async function sjfProcessing(processes) {
  return new Promise((resolve, reject) => {
    let isCpuFree = true;
    const fitProcessQueue = [];
    const processUsingCpu = [];
    let internalTimeCounter = -1;
    const procecessFinish = false;
    let processesParameter = processes;

    const incrementTimeCounter = setInterval(function() {
      internalTimeCounter = internalTimeCounter + 1;
    }, 1000);

    const insertProcessIntoFitProcessQueue = setInterval(function() {
      for (let i = 0; i < processesParameter.length; i++) {
        if (processesParameter[i].arrivalTime == internalTimeCounter) {
          fitProcessQueue.push(processesParameter[i]);
          delete processesParameter[i];
        }
      }
      const temp = processesParameter.filter(function(el) {
        return el != null;
      });
      processesParameter = temp;
    }, 1000);

    const tryToUseCpu = setInterval(function() {
      if (isCpuFree && fitProcessQueue.length > 0) {
        isCpuFree = false;
        /**
         *
         * @param {*} a
         * @param {*} b
         * @return {*}
         */
        function compare(a, b) {
          if (a.cycleDuration < b.cycleDuration) {
            return -1;
          }
          if (a.cycleDuration > b.cycleDuration) {
            return 1;
          }

          return 0;
        }
        fitProcessQueue.sort(compare);
        processUsingCpu.push(fitProcessQueue.shift());
        executionHistory.push({'name': processUsingCpu[0].name, 'execution': [internalTimeCounter, (internalTimeCounter + processUsingCpu[0].cycleDuration)]});
        processUsingCpu[0].remainingExecutionTime = processUsingCpu[0].remainingExecutionTime - processUsingCpu[0].cycleDuration;
        setTimeout(function() {
          if (processUsingCpu[0].remainingExecutionTime == 0) {
            processUsingCpu.shift();
          } else {
            fitProcessQueue.push(processUsingCpu.shift());
          }
          isCpuFree = true;
        }, processUsingCpu[0].cycleDuration * 1000);
      }
    }, 1000);

    const printRealTime = setInterval(function() {
      console.clear();
      console.log('| SJF |');
      console.log();
      console.log('=> Raw: ' + joinArrayWithComma(processesParameter));
      console.log('=> Fit queue: ' + joinArrayWithComma(fitProcessQueue));
      console.log('=> CPU: ' + joinArrayWithComma(processUsingCpu));
      console.log();
    }, 1000);

    const checkIfWorkIsCompleted = setInterval(function() {
      if (fitProcessQueue.length == 0 &&
        processesParameter.length == 0 &&
                processUsingCpu.length == 0 &&
                isCpuFree) {
        resolve(executionHistory);
      }
    }, 1000);
  });
}

/**
 * Starts the Round Robin processing simulation
 * @param {*} processes
 * @return {*}
 */
async function roundRobin(processes) {
  let quantum;
  do {
    quantum = parseInt(readline.question('Quantum: '));
  } while (Number.isNaN(quantum) || quantum <= 0);

  return new Promise((resolve, reject) => {
    let isCpuFree = true;
    const fitProcessQueue = [];
    const processUsingCpu = [];
    let internalTimeCounter = -1;
    let processesParameter = processes;

    const incrementTimeCounter = setInterval(function() {
      internalTimeCounter = internalTimeCounter + 1;
    }, 1000);

    const insertProcessIntoFitProcessQueue = setInterval(function() {
      for (let i = 0; i < processesParameter.length; i++) {
        if (processesParameter[i].arrivalTime == internalTimeCounter) {
          fitProcessQueue.push(processesParameter[i]);
          delete processesParameter[i];
        }
      }
      const temp = processesParameter.filter(function(el) {
        return el != null;
      });
      processesParameter = temp;
    }, 1000);

    const tryToUseCpu = setInterval(function() {
      if (isCpuFree && fitProcessQueue.length > 0) {
        isCpuFree = false;
        processUsingCpu.push(fitProcessQueue.shift());
        let quantumCycle;
        // Calulate reamaining time of execution
        if (processUsingCpu[0].remainingExecutionTime - quantum > 0) { // More cycles - run many times
          executionHistory.push({'name': processUsingCpu[0].name,
            'execution': [internalTimeCounter, (internalTimeCounter + quantum)]});
          processUsingCpu[0].remainingExecutionTime = processUsingCpu[0].remainingExecutionTime - quantum;
          quantumCycle = quantum * 1000;
        } else { // Last execution
          executionHistory.push({'name': processUsingCpu[0].name, 'execution': [internalTimeCounter,
            (internalTimeCounter + processUsingCpu[0].remainingExecutionTime)]});
          quantumCycle = processUsingCpu[0].remainingExecutionTime * 1000;
          processUsingCpu[0].remainingExecutionTime = 0;
        }

        setTimeout(function() {
          if (processUsingCpu[0].remainingExecutionTime <= 0) {
            processUsingCpu.shift();
          } else {
            fitProcessQueue.push(processUsingCpu.shift());
          }
          isCpuFree = true;
        }, quantumCycle);
      }
    }, 1000);

    const printRealTime = setInterval(function() {
      console.clear();
      console.log('| Round Robin |');
      console.log();
      console.log('=> Raw: ' + joinArrayWithComma(processesParameter));
      console.log('=> Fit queue: ' + joinArrayWithComma(fitProcessQueue));
      console.log('=> CPU: ' + joinArrayWithComma(processUsingCpu));
      console.log();
    }, 1000);

    const checkIfWorkIsCompleted = setInterval(function() {
      if (fitProcessQueue.length == 0 &&
        processesParameter.length == 0 &&
                processUsingCpu.length == 0 &&
                isCpuFree) {
        resolve(executionHistory);
      }
    }, 1000);
  });
}

/**
 *
 * @param {*} processes
 * @return {*}
 */
function priorityProcessing(processes) {
  return new Promise((resolve, reject) => {
    const interruptProcessingHistory = {};
    for (let i =0; i< processes.length; i++) {
      interruptProcessingHistory[processes[i].name] = [];
    }

    const fitProcessQueue = [];
    const processUsingCpu = [];
    let internalTimeCounter = -1;

    let processesParameter = processes;

    const incrementTimeCounter = setInterval(function() {
      internalTimeCounter = internalTimeCounter + 1;
      if (processUsingCpu.length != 0) {
        processUsingCpu[0].remainingExecutionTime -= 1;
        if (processUsingCpu[0].remainingExecutionTime == 0) {
          interruptProcessingHistory[`${processUsingCpu[0].name}`].push('End: '+internalTimeCounter);
          processUsingCpu.shift(); // Kill if time reach
        }
      }
    }, 1000);

    const insertProcessIntoFitProcessQueue = setInterval(function() {
      for (let i = 0; i < processesParameter.length; i++) {
        if (processesParameter[i].arrivalTime == internalTimeCounter) {
          fitProcessQueue.push(processesParameter[i]);
          delete processesParameter[i];
        }
      }
      const temp = processesParameter.filter(function(el) {
        return el != null;
      });
      processesParameter = temp;
    }, 1000);

    const checkHigherPriority = setInterval(function() {
      /**
       *
       * @param {*} a
       * @param {*} b
       * @return {*}
       */
      function compare(a, b) {
        if (a.priority > b.priority) {
          return -1;
        }
        if (a.priority < b.priority) {
          return 1;
        }
        return 0;
      }
      fitProcessQueue.sort(compare);

      // Fila de aptos com conteudo e cpu ocupada
      if (fitProcessQueue.length != 0 && processUsingCpu.length != 0) {
        if (fitProcessQueue[0].priority > processUsingCpu[0].priority) {
          const newHighPriority = fitProcessQueue.shift(); // Get the new high opriority
          interruptProcessingHistory[`${processUsingCpu[0].name}`].push('End: '+internalTimeCounter); // Set end of interruption
          const aux = processUsingCpu.shift(); // Remove old process
          fitProcessQueue.unshift(aux); // Return old to queue
          interruptProcessingHistory[`${newHighPriority.name}`].push('Start: '+internalTimeCounter); // Set start of the new process
          processUsingCpu.push(newHighPriority);
        }
      } else if (fitProcessQueue.length != 0 && processUsingCpu.length == 0) { // Fila de aptos com processo
        const aux = fitProcessQueue.shift(); // Remove the high priority
        interruptProcessingHistory[`${aux.name}`].push('Start: '+internalTimeCounter); // Set start time history
        processUsingCpu.push(aux); // Insert the first process
      }
    }, 1000);

    const printRealTime = setInterval(function() {
      console.clear();
      console.log('|Priority queue - preemptive|');
      console.log();
      console.log('=> Raw: ' + joinArrayWithComma(processesParameter));
      console.log('=> Fit queue: ' + joinArrayWithComma(fitProcessQueue));
      console.log('=> CPU: ' + joinArrayWithComma(processUsingCpu));
      console.log('=> Interrupt History: '+JSON.stringify(interruptProcessingHistory));
      console.log();
    }, 1000);

    const checkIfWorkIsCompleted = setInterval(function() {
      if (fitProcessQueue.length == 0 &&
        processesParameter.length == 0 &&
                processUsingCpu.length == 0
      ) {
        resolve(executionHistory);
      }
    }, 1000);
  });
}

/**
 *
 * @param {*} arr
 * @return {*}
 */
function joinArrayWithComma(arr) {
  const aux = [];
  for (const process of arr) {
    aux.push(process.name);
  }
  return '[' + aux.join(',') + ']';
}

/**
 * Generates the execution chart.
 */
function generateHtmlChart() {

}


main();


