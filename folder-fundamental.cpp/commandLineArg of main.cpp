#include<iostream>
using namespace std;
int main(int argc, char* argv[], char* env[]) {
	cout << "Object oriented programming language using C++" << endl;
	for (int  i = 0; i < argc; i++) {
		cout << (i + 1) << ":" << argv[i] << endl;
	}
	cout << endl << "Environment Variables:" << endl;
	for (int i = 0; env[i]; i++) {
		cout << (i + 1) << ":" << env[i] << endl;
	}
	return 0;
}
