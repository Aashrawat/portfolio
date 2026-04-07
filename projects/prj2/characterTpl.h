/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: FEB10
*/
#ifndef SENECA_CHARACTERTPL_H
#define SENECA_CHARACTERTPL_H
#include<iostream>
#include"character.h"
#include"characterTpl.h"
namespace seneca {
	template<typename T>
	class CharacterTpl :public Character {
		T m_health{};
		int m_healthMax{};
	public:
		CharacterTpl(const std::string& name, int healthMax)
			: Character(name.c_str()), m_healthMax(healthMax) {
			m_health = healthMax;
		}
		void takeDamage(int dmg) override {
			m_health -= dmg;

			if (static_cast<int>(m_health) <= 0) {
				m_health = 0;
				std::cout << "    " <<getName() << " has been defeated!" << std::endl;
			}
			else {
				std::cout << "    " << getName() << " took " << dmg
					<< " damage, " << static_cast<int>(m_health)
					<< " health remaining." << std::endl;
			}
		}
		int getHealth()const override {
			return static_cast<int>(m_health);
		}
		int getHealthMax() const override {
			return m_healthMax;
		}
		void setHealth(int health) override {
			m_health = health;
		}
		void setHealthMax(int health) override {
			m_health = health;
			m_healthMax = health;
		}
	};
}
#endif