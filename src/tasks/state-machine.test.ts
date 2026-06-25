import { StateMachine } from './state-machine';

describe('StateMachine', function() {
  it('should initialize with default state "stopped"', function() {
    const sm = new StateMachine();
    expect(sm.state).toBe('stopped');
  });

  it('should allow valid transitions from "stopped" to "idle"', function() {
    const sm = new StateMachine();
    sm.changeState('idle');
    expect(sm.state).toBe('idle');
  });

  it('should allow valid transitions from "idle" to "running"', function() {
    const sm = new StateMachine('idle');
    sm.changeState('running');
    expect(sm.state).toBe('running');
  });

  it('should throw on invalid transition from "stopped" to "running"', function() {
    const sm = new StateMachine('stopped');
    expect(() => sm.changeState('running')).toThrow(/invalid transition/);
  });

  it('should allow multiple valid transitions', function() {
    const sm = new StateMachine('stopped');
    sm.changeState('idle');
    sm.changeState('running');
    sm.changeState('stopped');
    sm.changeState('destroyed');
    expect(sm.state).toBe('destroyed');
  });

  it('should not allow any transition from "destroyed"', function() {
    const sm = new StateMachine('destroyed');
    expect(() => sm.changeState('idle')).toThrow(/invalid transition/);
    expect(() => sm.changeState('stopped')).toThrow(/invalid transition/);
  });
});
